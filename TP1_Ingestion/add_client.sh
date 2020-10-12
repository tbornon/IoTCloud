#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Please specify client id and password"
    echo "Usage : ./add_client.sh [clientId] [password]"
fi

# Create user 
docker-compose exec rabbitmq rabbitmqctl add_user $1 $2
echo "User $1 successfuly created with password $2"

# Set permissions for user. Can only write and read on queues starting by [clientId].
docker-compose exec rabbitmq rabbitmqctl set_permissions $1 "^$1\\..*$" "amq.default" "^$1\\..*$"
echo "Permissions set for the user. Can read and write on all queues starting by $1"