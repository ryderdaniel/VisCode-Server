import docker
import os
from threading import Thread
from datetime import datetime
import time

class VisNetwork:
	def __init__(self):
		'''
		Constructor. Treat this area like the config of the network, and services that will be
		provided by the system.
		'''
		self.__client = docker.from_env()
		self.__installdir = '/VisCode-Backend'
		
		#
		# Statistics
		#
		self.__update_interval = 2
		self.__entries_maintained = 75
		self.__entries_shown = 75

		self.__data_labels = []
		self.__stats = {
			'nginx':[],
			'frontend':[],
			'node-parser-api':[],
			'vis-python-api':[],
			'vis-java-api':[]
		}
		# Sample event object: 
		# {'event':'Service scaled', 'details':'frontend scaled to 5 workers',
		# 	'timestamp':'15/04/22 05:56:06','severity':'info'}
		# Severities:
		#	info -> alert-info (service scale up or down)
		#	danger -> alert-danger (load exceeds limit)
		#	warning -> alert-warning (container killed by you)
		# 	primary -> alert-primary (action done by you (restore, kill all, kill, spawn))
		self.__events_since_start = []

		#
		# Autoscale config
		#
		self.__stats_counted = 5
		self.__percentage_threshold = 70
		# True -> can autoscale
		self.__autoscale_services_scale_state = {
			'frontend':True, 
			'node-parser-api':True, 
			'vis-python-api':True, 
			'vis-java-api':True
		}

		#
		# Configs
		#
		self.__services = [
			'nginx', 
			'frontend', 
			'node-parser-api', 
			'vis-python-api', 
			'vis-java-api'
		]

		self.__info_labels = [
			'Reverse Proxy',
			'Frontend',
			'Node JSON Generator',
			'Python Debuggers',
			'Java Debuggers'
		]

		# These two dicts define the minimum number of containers that can exist while this system
		# is running, and the maximum number of containers that are allowed to be scaled to.
		self.__base_min = {
			'nginx':1,
			'frontend':4,
			'node-parser-api':4,
			'vis-python-api':4,
			'vis-java-api':4
		}

		self.__base_max = {
			'nginx':1,
			'frontend':12,
			'node-parser-api':12,
			'vis-python-api':12,
			'vis-java-api':12
		}

		#
		# Trackers
		# containers is a dict mapping names to container objects
		self.__containers = {}

		self.__service_count = {
			'nginx':0,
			'frontend':0,
			'node-parser-api':0,
			'vis-python-api':0,
			'vis-java-api':0
		}

		#
		# This function should populate the trackers
		#
		self.__check_health()


	# Private Methods
	def __check_health(self):
		self.update_trackers()

		# Now to scale services if there are fewer/more containers than mandated
		for service in self.__services:
			if self.__service_count[service] < self.__base_min[service]:
				Thread(target=self.__scale, args=[service, self.__base_min[service]]).start()
			if self.__service_count[service] > self.__base_max[service]:
				Thread(target=self.__scale, args=[service, self.__base_max[service]]).start()

	def __scale(self,service,count):
		os.popen(f'docker-compose -f ' + self.__installdir + 
			'/d_images/docker-compose.yml scale ' + service + '=' + str(count))

	def __shutdown(self):
		os.popen(f'docker-compose -f ' + self.__installdir + 
			'/d_images/docker-compose.yml stop')

	def __build(self):
		os.popen(f'cd ' + self.__installdir + 
			'/d_images; docker-compose --compatibility up -d')

	def __kill(self, container_name):
		os.popen(f'docker container kill {container_name}')

	def __auto_scale(self, service, target_size):
		self.__scale(service, target_size)
		self.update_trackers()
		self.__autoscale_services_scale_state[service] = False
		time.sleep(self.__update_interval * self.__stats_counted)
		self.__autoscale_services_scale_state[service] = True

	# Public Methods

	def update_trackers(self):
		containers = [ c for c in self.__client.containers.list() if 
			any(service in c.name for service in self.__services)]

		self.__service_count = {
			'nginx':0,
			'frontend':0,
			'node-parser-api':0,
			'vis-python-api':0,
			'vis-java-api':0
		}

		for c in containers:
			self.__containers[c.name] = c
			for service in self.__services:
				if service in c.name:
					self.__service_count[service] = self.__service_count[service] + 1
					break

	# Getters
	def get_containers(self):
		'''
		returns a list of container names. The format for container names is as follows:
		<service_name>_<worker_number>
		'''
		return self.__containers.keys()

	def get_count(self, service):
		return self.__service_count[service]

	def get_services(self):
		return self.__services

	def get_info_labels(self):
		return self.__info_labels

	def get_labels(self):
		return self.__data_labels[-self.__entries_shown:]

	def get_stats(self):
		return {
			'nginx':self.__stats['nginx'][-self.__entries_shown:],
			'frontend':self.__stats['frontend'][-self.__entries_shown:],
			'node-parser-api':self.__stats['node-parser-api'][-self.__entries_shown:],
			'vis-python-api':self.__stats['vis-python-api'][-self.__entries_shown:],
			'vis-java-api':self.__stats['vis-java-api'][-self.__entries_shown:]
		}

	def get_events(self):
            return self.__events_since_start[::-1]

	def get_interval(self):
		return self.__update_interval

	def get_settings(self):
		return {
			'interval':self.__update_interval,
			'entries_maintained':self.__entries_maintained,
			'entries_shown':self.__entries_shown,
			'stats_counted':self.__stats_counted,
			'threshold':self.__percentage_threshold,
			'lower_frontend':self.__base_min['frontend'],
			'lower_parser':self.__base_min['node-parser-api'],
			'lower_python':self.__base_min['vis-python-api'],
			'lower_java':self.__base_min['vis-java-api'],
			'upper_frontend':self.__base_max['frontend'],
			'upper_parser':self.__base_max['node-parser-api'],
			'upper_python':self.__base_max['vis-python-api'],
			'upper_java':self.__base_max['vis-java-api']
		}

	# Mutators
	def scale_service(self, service, target_size):
		'''
		If the target size is smaller than what the service has at the moment, the workers with the
		largest ID will be killed until the number of workers is equal to the target size.

		If the target_size if greater than the number of containers, workers will be generated until
		the nuber of containers match the target size.

		if the target size is equal, then simply return.
		'''
		if service not in self.__services:
			return

		target_size = min(target_size, self.__base_max[service])
		target_size = max(target_size, self.__base_min[service])

		if self.__service_count[service] == target_size:
			return

		Thread(target=self.__scale, args=[service, target_size]).start()


	def kill_container(self, container_name):
		if container_name in self.__containers.keys():
			Thread(target=self.__kill, args=[container_name]).start()

	def kill_all(self):
		self.__shutdown()
		self.update_trackers()

	def restore(self):
		self.__build()
		self.update_trackers()

	def get_logs(self, container_name):
		if container_name in self.__containers.keys():
			return self.__containers[container_name].logs().decode('utf-8')

	def add_data(self, label, percs):
		self.__data_labels.append(label)
		if len(self.__data_labels) > self.__entries_maintained:
			self.__data_labels.pop(0)

		for service, percentage in zip(self.__services, percs):
			self.__stats[service].append(percentage)
			if len(self.__stats[service]) > self.__entries_maintained:
				self.__stats[service].pop(0)

	def add_event(self, event, details, severity):
		track={
			'event':event,
			'details':details,
			'timestamp': datetime.strftime(datetime.now(),'%d/%m/%y %H:%M:%S'),
			'severity': severity
		}
		self.__events_since_start.append(track)

	def set_settings(self, changes):
		for setting in changes:
			if setting == 'interval':
				self.__update_interval = changes[setting]
			elif setting == 'entries_maintained':
				self.__entries_maintained = changes[setting]
			elif setting == 'entries_shown':
				self.__entries_shown = min(changes[setting], self.__entries_maintained)
			elif setting == 'stats_counted':
				self.__stats_counted = changes[setting]
			elif setting == 'threshold':
				self.__stats_counted = changes[setting]
			elif setting == 'lower_frontend':
				self.__base_min['frontend'] = changes[setting]
			elif setting == 'lower_parser':
				self.__base_min['node-parser-api'] = changes[setting]
			elif setting == 'lower_python':
				self.__base_min['vis-python-api'] = changes[setting]
			elif setting == 'lower_java':
				self.__base_min['vis-java-api'] = changes[setting]
			elif setting == 'upper_frontend':
				self.__base_max['frontend'] = changes[setting]
			elif setting == 'upper_parser':
				self.__base_max['node-parser-api'] = changes[setting]
			elif setting == 'upper_python':
				self.__base_max['vis-python-api'] = changes[setting]
			elif setting == 'upper_java':
				self.__base_max['vis-java-api'] = changes[setting]

	# Autoscaling Functions
	def check_scaling(self):
		# Gets average of last N stats collected for each service.
		for service in self.__autoscale_services_scale_state:
			if (self.__autoscale_services_scale_state[service] and 
				self.__service_count[service] < self.__base_max[service] and
				(sum(self.__stats[service][-self.__stats_counted:]) / self.__stats_counted) 
				> self.__percentage_threshold):
				# Scale up
				target_size = self.__service_count[service] + 1
				Thread(target=self.__auto_scale, args=[service, target_size]).start()
				self.add_event(
					'Service Auto-Scaled', 
					f'The service "{service}" has been scaled to {target_size} containers.',
					'success'
				)
			elif (self.__autoscale_services_scale_state[service] and 
				self.__service_count[service] > self.__base_min[service] and 
				(sum(self.__stats[service][-self.__stats_counted:]) / self.__stats_counted) 
				<= self.__percentage_threshold):
				# Scale down
				target_size = self.__service_count[service] - 1
				Thread(target=self.__auto_scale, args=[service, target_size]).start()
				self.add_event(
					'Service Auto-Scaled', 
					f'The service "{service}" has been scaled to {target_size} containers.',
					'success'
				)


	