# pull python apline with precompiled pandas (since it takes forever to compile it from source)
FROM nickgryg/alpine-pandas:3.8.1

# set work directory
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install psycopg2 and geodjango dependencies
RUN apk update \
    && apk add postgresql-dev gcc python3-dev musl-dev binutils proj geos-dev gdal-dev


# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip install -r requirements.txt

# copy project
COPY . /usr/src/app/

# run entrypoint.sh
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]