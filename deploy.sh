#!/bin/bash

# Generated with cat blah.txt | gzip | base64 -w0
base64 -d <<< "H4sIAAAAAAAAA42U227cNhCG7/UUAwKGWmRBFL5iVATwKWiClNtg61i7vWhFW4qtdiUakpxDn74zQ4qi9oSOjDUPM5/+mSGVgITJ5DSZLZ9Y43GyuxbvxpNASg47SPktmJRyhjkiZITN13ROT673Hjhsc0EA79H2g8MzDHWdHUoWOXIkbO7u1icY0cPJHihH0PX+f2F2HoQmLGRv62pz9sfl9buzy+XN2W/52+UpxFyJENGu8IY+MmNPyfPjmoY6FEgITrWgWPyf4R/t8MgN6IGTvKF+E/rG3pAVRHBFlKlMIaVjNJ6nRSohxc2UhW4OIF853s+szMkhckpM/C/XB+wbJ1R4FTvYRPqWSt9Yp5NmAZbvGK2N7qFabCFbFpTBWDTPwliqaq7UUqkLxeaJ/qXRFeKGUj28LK7aKMqTQDPqFzaE/ak0iFxfrXfuNDU/m66QuxqzBJlGOJa0yuluKmsVAlFwrtdRtll08p2JuN4jDOOWIUPK+uLignFwpa9WkUQSx/LGpZH0RuM3QmRhI6dk1dgGp9VHrJA4NSXIcx8p4fRpnaHJ6QLn1ITXDNM4XI40cslWK39yokyLAnlpimdUE0xmMtJGrXiNpqi3MQlNrNZ3Y6rJJJJYROPaa91kMdARXQXHOkloGk2G4pIAmX9c8ULqpoGoGL5g4K9vtmhqTV8HqrsQRUhy93seFgjpodNVkX8tWIsHuZOaJUcQOwIjo3jpbksaB8QnbIcSHcYD/PmyTI64nIyaAVCIZeO5G1hl56HO49C7pFWUSoGd9MIVJVqINPYq1UecFxt1vwcQGMnFGBEO4BXxm6UF3NvTI8eR2/SLrrAO5lA8IQ3qB3rdnIWrKTnch5GKFn2XmKZ8RuxRiA1uS5jD3IR+pxH9OI1jy4mWxhGUyY8kgXW45I/DXAHC+SkCi96BlRJU0bHc1k6ld0M/Uh/FtJjMDvbbsnlpS7it2scFrL6XVQc3pq2r7QKWZjDbuoLc0p42HY6vn+zXJLmEB1tW8KXuX9DjXzPUtoXB2i3+wFO1fYb76rFu26rrYVuZrgUMoz0Kw/yvu8oMVQmmh2fTDYn9DAY+163Zwnd0B3ju7N/VwwBmgHcfPv1+C3UL5z+dn0exqBq1Dk8V9OaxgseXujTtQwWmLRPT93U/8BTRN52Em6pvLOa5MS+YA2Jve1svMNUvdYmp/bOgOPjQYZh9fkLwr6aRyX+X4+Z4tQoAAA==" | gunzip
echo ""

# Check if there are root privileges
if [ "$EUID" -ne 0 ]
then
	echo "Please run the deploy script as root";
	exit;
fi

# Check if docker exists
if ! [[ -x "$(command -v docker)" ]]
then
	echo "Please install docker";
	exit;
fi

# Check if docker-compose exists
if ! [[ -x "$(command -v docker-compose)" ]]
then
	echo "Please install docker-compose";
	exit;
fi

# Check python install, and save where the system stores Python 3
pycomm=""
if [[ -x "$(command -v python3)" ]]
then
	curver="$(python3 --version | awk '{print $2}')";
	reqver="3.6.0";
	if ! [ "$(printf '%s\n' "$reqver" "$curver" | sort -V | head -n1)" = "$reqver" ]
	then 
		echo "Please update python to be at least 3.6.0";
		exit;
	fi
	pycomm="$(command -v python3)";
elif [[ -x "$(command -v python)" ]]
then
	curver="$(python --version | awk '{print $2}')";
	reqver="3.6.0";
	if ! [ "$(printf '%s\n' "$reqver" "$curver" | sort -V | head -n1)" = "$reqver" ]
	then 
		echo "Please update python to be at least 3.6.0";
		exit;
	fi
	pycomm="$(command -v python)";
else
	echo "Please install Python 3 version 3.6+"
	exit;
fi

# Check pip install
if ! [[ -x "$(command -v pip3)" ]]
then
	echo "Please install the pip module for Python 3";
	exit;
fi

# Check make install

if ! [[ -x "$(command -v make)" ]]
then
	echo "Please install make";
	exit;
fi

# TLS Related

function hasTLS() {
	read -p "Have you placed 'server.crt' and 'server.key' into d_images/nginx (y/n)? " answer;
	case ${answer:0:1} in
	    y|Y )
	        echo "Proceeding with setup"
	    ;;
	    * )
	        echo "Please place the certificates into d_images/nginx named 'server.crt' and";
	        echo "'server.key' and run this script again.";
	        exit;
	    ;;
	esac
}

function generateTLS() {
	openssl req -x509 -newkey rsa:4096 -sha256 -nodes -keyout d_images/nginx/server.key -out d_images/nginx/server.crt -subj "/CN=$1" -days 365
}

read -p "Do you have a valid TLS Certificate you would like to use (y/n)?: " answer;
case ${answer:0:1} in
    y|Y )
        hasTLS
    ;;
    * )
        read -p "Please enter the hostname of the server. (e.g. fyp.rkds.xyz): " domainName;
        generateTLS $domainName;
    ;;
esac

# Install pip packages
echo "Installing pip packages..."
pip3 install flask turbo-flask docker
echo ""

# Update working directory in autoscaler
sed -i "14s/'[^']*'/\'$(pwd|sed 's/\//\\\//g')'/g" autoscaler/VisCodeInteractor.py

# Build Images and Run Containers

echo "Building images and starting containers..."
cd d_images; make startbuild; cd ..;
echo ""

# Install Service
echo "Installing viscode backend service"

cat >/etc/systemd/system/viscode.service <<EOL
[Unit]
Description=VisCode Backend Management Service
After=network.target

[Service]
User=root
WorkingDirectory=$(pwd)/autoscaler
ExecStart=$pycomm $(pwd)/autoscaler/scaler.py
Restart=always

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl start viscode

echo ""
echo "Congratulations!! If there were no errors, then your system should be up!";
echo "To access the web console, follow the instructions in readme.md";
echo "To interact with the viscode service, run 'systemctl start/stop/restart viscode'"
echo "To see logs of the web console, run 'journalctl -u viscode'";
