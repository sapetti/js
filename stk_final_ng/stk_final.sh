#!/bin/sh
#

echo "init mongo --repair"
sudo nohup ./mongo-nonx86/mongod --repair
echo "init mongo"
sudo nohup ./mongo-nonx86/mongod > /home/pi/logs/mongodb.log &

echo "init variables"
NO=0
value=0
echo "init loop"
while [ $NO == $value ]
do
	#echo $value
	echo "waiting for mongo"
	netstat -a | grep 27017
	value=[ $?  -eq "0" ] && echo "1"  || echo 0
done

echo "db initializated"
#sudo nohup node /home/pi/projects/stk_final/server.js > /home/pi/logs/stk_final.logs &

#sudo nohup ./home/pi/projects/photo_boot/photo_boot_dropbox.py > /home/pi/logs/photo_boot.logs &

