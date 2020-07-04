# connection_monitor

Dependencies:
Node: 
  pip install paho-mqtt       // mqtt libraries
  sudo pip install paho-mqtt  // systemd service runs as root, need to ensure root has access to python libraries
  sudo /usr/bin/python3 -m pip install paho-mqtt  // need to install seperately if running python3

Service definition needs to be setup in systemd services (beware inconsistent use of - and _)
  sudo ln ~/connection_monitor/connection_monitor.service /etc/systemd/system/connection_monitor.service

  systemctl daemon-reload
  systemctl start|stop|restart connetion_monitor
  systemctl status connection_monitor