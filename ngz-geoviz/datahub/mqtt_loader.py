import json
import logging
from datetime import date, datetime
import time

import paho.mqtt.client as mqtt
from django.conf import settings

logger = logging.getLogger(__name__)


class MqttLoader:
    WEBSOCKETS_TRANSPORT = "websockets"

    def __init__(self, id_prefix, host, topic, username, password, port, on_json_message):
        self.id_prefix = id_prefix,
        self.username = username
        self.password = password
        self.host = host
        self.topic = topic.format(date=datetime.now().strftime('%Y-%m-%d')) if "{date}" in topic else topic
        self.port = port
        self.callback = on_json_message
        self.client = None

    def connect(self, keepalive=60):
        client = mqtt.Client(client_id=f"{self.id_prefix}_python_{date.today()}",
                             transport=MqttLoader.WEBSOCKETS_TRANSPORT)
        if self.username != "":
            client.username_pw_set(self.username, self.password)
        client.on_connect = self.__on_connect
        client.on_message = self.__on_message
        client.on_disconnect = lambda _: logger.warning(f"Client for host {self.host} disconnected")
        client.tls_set_context()
        # client.enable_logger(logger=logger)
        client.connect(self.host, self.port, keepalive)
        self.client = client

        started = time.time()
        reset_timeout = settings.DIGITRAFFIC["RESET_MQTT_MINUTES"] * 60 - 10

        rc = mqtt.MQTT_ERR_SUCCESS
        while time.time() - started <= reset_timeout:
            rc = self.client.loop(timeout=10)

        if rc != mqtt.MQTT_ERR_SUCCESS:
            logger.warning(f"Loop ended with code {rc}")

    def __on_connect(self, client, userdata, flags, rc):
        logger.debug(f"Connected to {self.host} with code {rc}")

        # Subscribing in on_connect() means that if we lose the connection and
        # reconnect then subscriptions will be renewed.
        client.subscribe(self.topic)

    def __on_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload)
        except Exception as e:
            logger.exception(f"Failed to parse message {msg.payload}")
            raise e

        self.callback(data)
