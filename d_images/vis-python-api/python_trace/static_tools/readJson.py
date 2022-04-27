import json

def read_json(fname):
    file = open(fname)
    trace_data = json.load(file)
    '''
    for line in trace_data['trace']:
        get_objInfo(line)
        
    file.close()

read_json('res1.json')