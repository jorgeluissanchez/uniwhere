import { ParseResult, PlyStreamingParserDataSource } from '@/features/viewer/data/datasources/ply-streaming-parser-data-source';
import { File } from 'expo-file-system';
import * as THREE from 'three';

const MAX_HEADER_BYTES = 8192;
const CHUNK_VERTICES = 80_000;

type PropType = 'float' | 'double' | 'int' | 'uint' | 'short' | 'ushort' | 'uchar';

const PROP_SIZES: Record<PropType, number> = {
  float: 4, double: 8, int: 4, uint: 4, short: 2, ushort: 2, uchar: 1,
};

type Prop = { name: string; type: PropType; size: number; offset: number };

type Header = {
  vertexCount: number;
  stride: number;
  dataOffset: number;
  props: Prop[];
};

function parseHeader(raw: string): { header: Header; headerBytes: number } {
  const endTag = 'end_header\n';
  const endAlt = 'end_header\r\n';
  let endIdx = raw.indexOf(endTag);
  let tagLen = endTag.length;
  if (endIdx === -1) { endIdx = raw.indexOf(endAlt); tagLen = endAlt.length; }
  if (endIdx === -1) { throw new Error('PLY: end_header no encontrado'); }

  const headerText = raw.substring(0, endIdx);
  const headerBytes = endIdx + tagLen;

  let vertexCount = 0;
  const props: Prop[] = [];
  let inVertex = false;

  for (const line of headerText.split('\n').map(l => l.trim())) {
    if (line.startsWith('format ascii')) {
      throw new Error('Formato ASCII no soportado en modo streaming');
    }
    if (line.startsWith('element vertex ')) {
      vertexCount = parseInt(line.split(' ')[2], 10);
      inVertex = true;
    } else if (line.startsWith('element ')) {
      inVertex = false;
    } else if (line.startsWith('property ') && inVertex) {
      const parts = line.split(' ');
      const type = parts[1] as PropType;
      const name = parts[2];
      props.push({ name, type, size: PROP_SIZES[type] ?? 4, offset: 0 });
    }
  }

  let stride = 0;
  for (const p of props) { p.offset = stride; stride += p.size; }

  return { header: { vertexCount, stride, dataOffset: headerBytes, props }, headerBytes };
}

function readFloat(view: DataView, offset: number, type: PropType): number {
  switch (type) {
    case 'float':  return view.getFloat32(offset, true);
    case 'double': return view.getFloat64(offset, true);
    case 'int':    return view.getInt32(offset, true);
    case 'uint':   return view.getUint32(offset, true);
    case 'short':  return view.getInt16(offset, true);
    case 'ushort': return view.getUint16(offset, true);
    case 'uchar':  return view.getUint8(offset);
  }
}

export class PlyStreamingParserDataSourceImpl implements PlyStreamingParserDataSource {
  async parse(fileUri: string, maxPoints: number): Promise<ParseResult> {
    const handle = new File(fileUri).open();
    try {
      // 1. Leer encabezado
      const headerBytes = handle.readBytes(MAX_HEADER_BYTES);
      const headerRaw = new TextDecoder().decode(headerBytes);
      const { header } = parseHeader(headerRaw);
      const { vertexCount, stride, dataOffset, props } = header;

      // 2. Calcular paso de muestreo
      const step = vertexCount <= maxPoints ? 1 : Math.ceil(vertexCount / maxPoints);
      const outputCount = Math.ceil(vertexCount / step);

      // 3. Localizar propiedades necesarias
      const xP = props.find(p => p.name === 'x');
      const yP = props.find(p => p.name === 'y');
      const zP = props.find(p => p.name === 'z');
      const rP = props.find(p => p.name === 'red');
      const gP = props.find(p => p.name === 'green');
      const bP = props.find(p => p.name === 'blue');

      if (!xP || !yP || !zP) { throw new Error('PLY: faltan propiedades x/y/z'); }
      const hasColors = !!(rP && gP && bP);

      const positions = new Float32Array(outputCount * 3);
      const colors = hasColors ? new Float32Array(outputCount * 3) : null;

      // 4. Leer vértices en chunks usando FileHandle con seek por offset
      let outIdx = 0;
      let vertexIdx = 0;

      while (vertexIdx < vertexCount) {
        const chunkVerts = Math.min(CHUNK_VERTICES, vertexCount - vertexIdx);
        handle.offset = dataOffset + vertexIdx * stride;
        const chunkBytes = handle.readBytes(chunkVerts * stride);
        const view = new DataView(chunkBytes.buffer, chunkBytes.byteOffset, chunkBytes.byteLength);

        for (let i = 0; i < chunkVerts; i++) {
          if ((vertexIdx + i) % step === 0 && outIdx < outputCount) {
            const base = i * stride;
            positions[outIdx * 3 + 0] = readFloat(view, base + xP.offset, xP.type);
            positions[outIdx * 3 + 1] = readFloat(view, base + yP.offset, yP.type);
            positions[outIdx * 3 + 2] = readFloat(view, base + zP.offset, zP.type);
            if (hasColors && colors && rP && gP && bP) {
              colors[outIdx * 3 + 0] = view.getUint8(base + rP.offset) / 255;
              colors[outIdx * 3 + 1] = view.getUint8(base + gP.offset) / 255;
              colors[outIdx * 3 + 2] = view.getUint8(base + bP.offset) / 255;
            }
            outIdx++;
          }
        }
        vertexIdx += chunkVerts;
      }

      // 5. Construir BufferGeometry
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, outIdx * 3), 3));
      if (hasColors && colors) {
        geometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, outIdx * 3), 3));
      }

      return { geometry, vertexCount: outIdx, hasColors };
    } finally {
      handle.close();
    }
  }
}
