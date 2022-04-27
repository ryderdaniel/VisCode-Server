from flask import Flask, render_template, request
from turbo_flask import Turbo

from VisCodeInteractor import VisNetwork

import os
import threading
import time
from datetime import datetime, timedelta

stub = VisNetwork()

app = Flask(__name__)
turbo = Turbo(app)	

# Pages

@app.route("/")
def index():
	return render_template('index.html')


@app.route("/containers")
def view_containers():
	return render_template('containers.html', labels=stub.get_labels(), data=stub.get_stats())


@app.route("/settings", methods=['GET','POST'])
def set_settings():
	if request.method == "POST":
		if "granularity" in request.form:
			settings = {}
			if request.form["interval"] != '':
				settings['interval'] = request.form["interval"]
			if request.form["entries_maintained"] != '':
				settings['entries_maintained'] = request.form["entries_maintained"]
			if request.form["entries_shown"] != '':
				settings['entries_shown'] = request.form["entries_shown"]
			stub.add_event(
				'Settings Changed', 
				f'The following settings were changed regarding granularity:\n{settings}.', 
				'warning'
			)
			stub.set_settings(settings)

		if "autoscale" in request.form:
			settings = {}
			if request.form["stats_counted"] != '':
				settings['stats_counted'] = request.form["stats_counted"]
			if request.form["threshold"] != '':
				settings['threshold'] = request.form["threshold"]
			stub.add_event(
				'Settings Changed', 
				f'The following settings were changed regarding autoscaling:\n{settings}.',
				'warning'
			)
			stub.set_settings(settings)

		if "boundary" in request.form:
			settings = {}
			if request.form["lower_frontend"] != '':
				settings['lower_frontend'] = request.form["lower_frontend"]
			if request.form["lower_parser"] != '':
				settings['lower_parser'] = request.form["lower_parser"]
			if request.form["lower_python"] != '':
				settings['lower_python'] = request.form["lower_python"]
			if request.form["lower_java"] != '':
				settings['lower_java'] = request.form["lower_java"]

			if request.form["upper_frontend"] != '':
				settings['upper_frontend'] = request.form["upper_frontend"]
			if request.form["upper_parser"] != '':
				settings['upper_parser'] = request.form["upper_parser"]
			if request.form["upper_python"] != '':
				settings['upper_python'] = request.form["upper_python"]
			if request.form["upper_java"] != '':
				settings['upper_java'] = request.form["upper_java"]

			stub.add_event(
				'Settings Changed',
				f'The following settings were changed regarding boundaries:\n{settings}.',
				'warning'
			)
			stub.set_settings(settings)

		return render_template('settings.html', settings=stub.get_settings())
	else:
		return render_template('settings.html', settings=stub.get_settings())

@app.route("/events")
def events():
	return render_template('events.html', events=stub.get_events(), timestamp=datetime.now())

@app.route("/logs/<container_name>")
def retrieve_logs(container_name):
	log_text = stub.get_logs(container_name)
	stub.add_event(
		'Logs Checked', 
		f'Logs checked for {container_name}.', 
		'info')
	return render_template('logs.html', containername=container_name,
		timestamp=datetime.now(), logs=log_text)

# API endpoints

@app.route("/stats")
def get_stats():
	return {'labels':stub.get_labels(), 'stats':stub.get_stats()}


@app.route("/kill", methods=['GET','POST'])
def kill_container():
	if request.method == 'POST':
		container_name = request.form["container_name"]

		if container_name == 'all':
			stub.kill_all()
			stub.add_event(
				'System Stopped', 
				'The system has been called to stop.', 
				'primary'
			)
		else:
			stub.kill_container(container_name)
			stub.add_event(
				'Container Killed', 
				f'The container {container_name} was called to be killed.',
				'warning'
			)

		return "done"
	else:
		return 'Send a post request to /kill'

@app.route("/spawn", methods=['GET', 'POST'])
def spawn_container():
	if request.method == 'POST':
		service = request.form["service"]

		containers = stub.get_containers()
		if service == 'startbuild':
			stub.restore()
			stub.add_event(
				'Service Restored', 
				'All containers started in accordance with compose file.',
				'success'
			)
		else:
			count = 1 + stub.get_count(service)
			stub.scale_service(service, count)
			stub.add_event(
				'Service Scaled', 
				f'The service "{service}" has been scaled to {count} containers.', 
				'success'
			)
		return "done"
	else:
		return 'Send a post request to /kill'


# Loaded content functions

@app.context_processor
def stats_load():
	dump = os.popen("docker stats --no-stream --format '{{.Name}} {{.CPUPerc}} {{.MemPerc}} \
		{{.NetIO}}'").read().split('\n')

	nginx_pool = {}
	front_pool = {}
	parse_pool = {}
	py_debug_pool = {}
	java_debug_pool = {}

	for container in dump[:-1]:
		container = container.split()
		obj = {
			'cpu':container[1], 
			'mem':container[2], 
			'netIn':container[3], 
			'netOut':container[5], 
			'fullname':container[0] 
		}
		if 'nginx' in container[0]:
			nginx_pool[int(container[0].split('_')[-1])] = obj
		elif 'frontend' in container[0]:
			front_pool[int(container[0].split('_')[-1])] = obj
		elif 'node-parser-api' in container[0]:
			parse_pool[int(container[0].split('_')[-1])] = obj
		elif 'vis-python-api' in container[0]:
			py_debug_pool[int(container[0].split('_')[-1])] = obj
		elif 'vis-java-api' in container[0]:
			java_debug_pool[int(container[0].split('_')[-1])] = obj
	
	format_data = '%d/%m %H:%M:%S'
	stub.add_data(datetime.strftime(datetime.now(),format_data), [
		sum([float(val['cpu'][:-1]) for val in nginx_pool.values()])/max(1,len(nginx_pool)),
		sum([float(val['cpu'][:-1]) for val in front_pool.values()])/max(1,len(front_pool)),
		sum([float(val['cpu'][:-1]) for val in parse_pool.values()])/max(1,len(parse_pool)),
		sum([float(val['cpu'][:-1]) for val in py_debug_pool.values()])/max(1,len(py_debug_pool)),
		sum([float(val['cpu'][:-1]) for val in java_debug_pool.values()])/max(1,len(java_debug_pool))
		])

	return {
	'nginx_stats':nginx_pool,
	'frontend_stats':front_pool,
	'parser_stats':parse_pool,
	'py_debugger_stats':py_debug_pool,
	'java_debugger_stats':java_debug_pool
	}

# Thread related functions
@app.before_first_request
def before_first_request():
	threading.Thread(target=update_load).start()

def update_load():
    with app.app_context():
        while True:
            time.sleep(stub.get_interval())
            stub.update_trackers()
            turbo.push(turbo.replace(render_template('stats.html'), 'stats'))
            stub.check_scaling()


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000)
