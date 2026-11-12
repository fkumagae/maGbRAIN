"""Build lateral odor membership using the already verified atlas input hashes."""
import argparse,csv,gzip,hashlib,json,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--data-dir',type=Path,required=True);args=p.parse_args()
out=Path(__file__).resolve().parent;root=args.data_dir
atlas=json.loads((out.parent/'sensory-lab/atlas.json').read_text(encoding='utf8'))
for name in ['neurons.csv.gz','classification.csv.gz']:
    assert hashlib.sha256((root/name).read_bytes()).hexdigest()==atlas['sources'][name],name
assert hashlib.sha256((root/'connectome.bin.gz').read_bytes()).hexdigest()==atlas['connectomeSHA256']
b=gzip.decompress((root/'connectome.bin.gz').read_bytes());n,e=struct.unpack_from('<II',b)
groups=[struct.unpack_from('<BH',b,8+12*e+3*i)[1] for i in range(n)]
order=sorted(range(n),key=lambda i:groups[i])
ids=list(csv.DictReader(gzip.open(root/'neurons.csv.gz','rt')))
ann={r['root_id']:r for r in csv.DictReader(gzip.open(root/'classification.csv.gz','rt'))}
meta=json.loads((out.parent/'data/neuron_meta.json').read_text())
left=[];right=[];excluded=[]
for s,i in enumerate(order):
    if meta['groups'][groups[i]]['name']=='OLF_ORN_FOOD':
        side=ann.get(ids[i]['root_id'],{}).get('side','');entry=dict(index=s,rootId=ids[i]['root_id'])
        (left if side=='left' else right if side=='right' else excluded).append(entry)
mapping=dict(connectomeSHA256=atlas['connectomeSHA256'],canonicalWorkerSHA256=atlas['canonicalWorkerSHA256'],sources=atlas['sources'],left=left,right=right,excluded=excluded,readout=[dict(index=s,rootId=ids[order[s]]['root_id'],side=ann[ids[order[s]]['root_id']]['side']) for s in [100133,99987]],note='Side annotations identify membership only. Antenna encoding and motor interpretation are engineering hypotheses.')
(out/'sensory-map.json').write_text(json.dumps(mapping,separators=(',',':')),encoding='utf8')
print(len(left),len(right),len(excluded))
