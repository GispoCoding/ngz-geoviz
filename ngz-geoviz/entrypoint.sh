#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

#python manage.py flush --no-input
python manage.py migrate
python manage.py createcachetable
python manage.py collectstatic --no-input --clear

# Make sure you have DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_PASSWORD
# and DJANGO_SUPERUSER_EMAIL supplied
python manage.py createsuperuser --noinput
python manage.py loaddata data/initial_visualizations.json

exec "$@"