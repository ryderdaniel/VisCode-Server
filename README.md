![](https://i.imgur.com/LFVQgHH.png)

# VisCode

VisCode is an educational tool to help beginners grasp concepts related to programming by offering a visual representation of common concepts found in code. This project was created as part of a final year project at HKUST.

Users interact with the tool by installing the related [VisCode extension](https://marketplace.visualstudio.com/items?itemName=VisCodeUST.v1scode) from the VS Code marketplace. A server must also be set up to receive the requests - the purpose of this repository.

### Architecture

![](https://i.imgur.com/diV1yoU.png)

This system is managed by docker and a management console installed as a service. The system works by maintaining worker pools which they are called upon based on Docker's round-robin DNS name resolution.

### Installation

Simply clone this repository anywhere on your server, navigate to the base directory of this repository, then run `bash deploy.sh`. It will guide you through the installation process. To allow the script to run smoothly, have the following installed:
* Docker
* Docker-compose
* Python 3.6+
* pip3

You will also be able to use your own TLS certificate. If you would like to use your own, place the crt and key file under `d_images/nginx/server.<crt/key>`.

### Usage

Once the deployment script has been run, assuming there are no issues, you will have a virtual network of containers running, and port 443 will be used on your host system, and port 5000 will be used locally.

To access the management console, you can use an SSH proxy into the server which is done like so:

1. SSH into the machine with the -D flag: `ssh -D1080 root@<server IP>`  
	Note that the port 1080 is arbitrary, and you may use whichever port works for you.
2. Download a proxy for whichever web browser you use. In this case, I am using FoxyProxy on Firefox.
3. Configure your proxy with the following information:
	* Proxy Type: SOCKS5
	* Proxy IP Address: 127.0.0.1
	* Port: 1080 (same as port used in ssh command)
	![](https://i.imgur.com/00Vd1dx.png)
4. Connect to proxy, then access [http://127.0.0.1:5000](http://127.0.0.1:5000). You should see the following:  
	![](https://i.imgur.com/VTtjUOT.png)
5. You may now begin managing your containers!

#### Container Overview

By clicking the "Manage Containers" button on the splash screen, you are greeted with a screen that can be broken down into three areas: the system panel, the load graph, and the container list.

* __The System Panel__  
	![](https://i.imgur.com/Q4IRVxU.png)  
	* Stop ALL Containers: Does as advertised. Shuts down all the containers.
	* Force Minimum: Brings the system back up to its minimum state defined in the docker-compose file located in `d_images`
	* System Events: When an event important to the sytem occurs, it is logged and is accessible from here.
* __The Load Graph__  
	![](https://i.imgur.com/7Fx0aqV.png)
	* This graph tells you the average CPU load of each worker pool in an automatically updated graph.
* __The Container List__  
	![](https://i.imgur.com/usGjxJ5.png)
	* An automatically updated list of containers in the system. You can view logs of individual containers, kill containers, or manually add containers to a pool of workers.

__Note:__ To improve the throughput of the system, containers are automatically created and destroyed when container load exceeds an amount defined in the system settings.

#### Settings

By clicking the "System Settings" button on the splash screen, you are redirected to a screen where you can define system settings. The available settings are:
* How often information is probed from the containers
* How many data points to store in memory
* How many points to show on the graph
* How many samples to avergae for autoscaling
* The autoscaling threshold
* The upper and lower bound for number of containers per pool needed to operate

#### The Management Console

The management console is a flask application that is run through a systemd service.

To stop the management console:
```bash
systemctl stop viscode
```

To start the management console:
```bash
systemctl start viscode
```

Sometimes when you need to manually stop and start the containers, you can use the docker-compose file. To do this, navigate to `d_images`, and if you have `make` installed you can make usage of the makefile:

Start the containers:
```bash
make start
```

Stop the containers:
```bash
make stop
```

Rebuild the containers if changed and run:
```bash
make startbuild
```

Rebuild the containers:
```bash
make build
```

To see logs of the management console:
```bash
journalctl -u viscode
```
