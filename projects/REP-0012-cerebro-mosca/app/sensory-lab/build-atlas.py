"""Verify every binary edge/metadata entry before assigning original root IDs."""
import csv, gzip, hashlib, importlib.util, json, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT/'scripts/build_connectome.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
ids, nts = builder.load_neurons(ROOT/'data/neurons.csv.gz')
assert len(ids) == len(set(ids))
index = builder.build_index(ids)
regions, groups = builder.classify_neurons(ROOT/'data/classification.csv.gz', ids, index)
edges = builder.aggregate_edges(ROOT/'data/connections.csv.gz', index, nts)
compressed = (ROOT/'data/connectome.bin.gz').read_bytes()
binary = gzip.decompress(compressed)
n, e = struct.unpack_from('<II', binary)
assert (n, e) == (len(ids), len(edges))
for j, edge in enumerate(edges):
    assert struct.pack('<IIf', *edge) == binary[8+j*12:20+j*12], f'Edge {j} differs'
for j in range(n):
    assert struct.pack('<BH', regions[j], groups[j]) == binary[8+e*12+j*3:11+e*12+j*3], f'Metadata {j} differs'
assert len(binary) == 8+e*12+n*3
order = sorted(range(n), key=lambda j: groups[j])  # stable, as in worker buildGroupStructures
reverse = {original: sorted_index for sorted_index, original in enumerate(order)}
with gzip.open(ROOT/'data/classification.csv.gz', 'rt', encoding='utf8') as f:
    annotations = {row['root_id']: row for row in csv.DictReader(f)}
mapping = json.loads((ROOT/'sensory-lab/neuron-map.json').read_text())
assert mapping['workerSHA256'] == hashlib.sha256((ROOT/'js/sim-worker.js').read_bytes()).hexdigest()
assert mapping['connectomeSHA256'] == hashlib.sha256(compressed).hexdigest()
candidate_indices = sorted({c['sortedIndex'] for run in mapping['runs'] for c in run['candidates']})
meta = json.loads((ROOT/'data/neuron_meta.json').read_text())
records = {}
for s in candidate_indices:
    original = order[s]
    records[original] = dict(sortedIndex=s, originalIndex=original, rootId=ids[original], group=meta['groups'][groups[original]]['name'], annotations=annotations.get(ids[original], {}), incoming=[], outgoing=[])
for pre, post, weight in edges:
    if pre in records: records[pre]['outgoing'].append(dict(rootId=ids[post], sortedIndex=reverse[post], group=meta['groups'][groups[post]]['name'], rawWeight=weight))
    if post in records: records[post]['incoming'].append(dict(rootId=ids[pre], sortedIndex=reverse[pre], group=meta['groups'][groups[pre]]['name'], rawWeight=weight))
atlas = dict(version=1, canonicalWorkerSHA256=hashlib.sha256((ROOT/'js/sim-worker.js').read_text().encode()).hexdigest(), verification='All original CSV-derived edges and metadata match decompressed binary byte-for-byte; stable group ordering matches worker.', neuronCount=n, edgeCount=e, connectomeSHA256=mapping['connectomeSHA256'], sources={name:hashlib.sha256((ROOT/'data'/name).read_bytes()).hexdigest() for name in ['neurons.csv.gz','classification.csv.gz','connections.csv.gz']}, candidates=list(records.values()), note='Dataset annotations are not experimentally validated motor functions. rootId is a string to preserve integer precision. Raw signed weights are before worker normalization.')
(ROOT/'sensory-lab/atlas.json').write_text(json.dumps(atlas, ensure_ascii=False, separators=(',',':')), encoding='utf8')
print(f'Verified {n} neurons, {e} edges; atlas: {len(records)} candidates')
