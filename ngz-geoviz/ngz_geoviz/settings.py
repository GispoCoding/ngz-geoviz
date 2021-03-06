"""
Django settings for ngz_geoviz project.

Generated by 'django-admin startproject' using Django 3.0.3.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

# TODO: replace with env variable
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", default='g0okp@xwtaxh*n8xv#i*(pap1t-jb%h004g9-^%*gaz3lt%*y8')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = int(os.environ.get("DEBUG", default=0))

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", default='*').split(" ")

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'storages',
    'django.contrib.gis',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_gis',
    'corsheaders',
    'frontend',
    'datahub'
]

MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ngz_geoviz.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ngz_geoviz.wsgi.application'

# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": os.environ.get("SQL_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.environ.get("SQL_DATABASE", os.path.join(BASE_DIR, "db.sqlite3")),
        "USER": os.environ.get("SQL_USER", "user"),
        "PASSWORD": os.environ.get("SQL_PASSWORD", "password"),
        "HOST": os.environ.get("SQL_HOST", "localhost"),
        "PORT": os.environ.get("SQL_PORT", "5432"),
    }
}

# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/

USE_S3 = int(os.getenv('USE_S3'))

if USE_S3:
    # AWS settings
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_IS_GZIPPED = True
    GZIP_CONTENT_TYPES = ('text/plain', 'text/css', 'text/csv',
                          'text/javascript', 'application/javascript', 'application/x-javascript',
                          'application/json', 'image/png'
                          )
    # s3 static settings
    AWS_LOCATION = 'static'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/'
    STATICFILES_STORAGE = 'datahub.storage_backends.StaticStorage'

    # s3 public media settings
    PUBLIC_MEDIA_LOCATION = 'media'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{PUBLIC_MEDIA_LOCATION}/'
    DEFAULT_FILE_STORAGE = 'datahub.storage_backends.PublicMediaStorage'
else:
    STATIC_URL = '/static/'
    STATIC_ROOT = os.path.join(BASE_DIR, "static")
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DATAHUB_ROOT = os.path.join(BASE_DIR, "static")

DATAHUB_STATIC = os.path.join(BASE_DIR, "datahub/static")
STATICFILES_DIRS = [os.path.join(BASE_DIR, "frontend/static"), DATAHUB_STATIC]

###### NGZ settings ##########################################

HTTPS_IN_USE = int(os.environ.get("HTTPS", 0))

NGZ_BASE_URL = os.environ.get("NGZ_BASE_URL", "http://localhost:8000")

if HTTPS_IN_USE:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True

# Allow connections only from local frontend development server
CORS_ORIGIN_ALLOW_ALL = False
CORS_ORIGIN_WHITELIST = [NGZ_BASE_URL] + os.environ.get("DJANGO_CORS_WHITELIST",
                                                        default='http://localhost:8080 http://localhost:8081').split(
    " ")
REST_FRAMEWORK = {
    # TODO: Uncomment following to prevent the use of browsable api
    #
    #     'DEFAULT_RENDERER_CLASSES': (
    #         'rest_framework.renderers.JSONRenderer',
    #     )
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/minute',
        'user': '1000/day'
    }
}

# For Django Q
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'ngz_cache_table',
    }
}

Q_CLUSTER = {
    'name': 'DjangORM',
    'workers': 4,
    'timeout': 300,
    'retry': 290,
    'queue_limit': 20,
    'catch_up': False,
    'ack_failures': True,
    'save_limit': 20,
    'recycle': 10,
    'poll': 1,
    'bulk': 5,
    'orm': 'default'
}

# CELERY stuff
CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_BEAT_SCHEDULE = {
    'populate-digitraffic-data': {
        'task': 'datahub.tasks.populate_digitraffic_data',
        'schedule': int(os.environ.get("DIGITRAFFIC_SCHEDULE_MINUTES", "5")) * 60,
        'kwargs': {"resample_period": os.environ.get("DIGITRAFFIC_RESAMPLE_PERIOD", "1min")}
    },
    'fetch-digitraffic-trains': {
        'task': 'datahub.tasks.load_digitraffic_trains',
        'schedule': int(os.environ.get("RESET_MQTT_MINUTES", 2)) * 60
    },
    'fetch-digitraffic-vessels': {
        'task': 'datahub.tasks.load_digitraffic_vessels',
        'schedule': int(os.environ.get("RESET_MQTT_MINUTES", 2)) * 60
    }
}

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
    },
    'handlers': {
        'djangofile': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, "logs", "ngz-django.log"),
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 10,
            'formatter': 'standard'
        },
        'dhfile': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, "logs", "ngz-dh.log"),
            'maxBytes': 1024 * 1024,
            'backupCount': 10,
            'formatter': 'standard'
        },
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['djangofile', 'console'] if DEBUG else ['djangofile'],
            'level': 'INFO' if DEBUG else 'INFO',
            'propagate': True,
        },
        'datahub': {
            'handlers': ['dhfile', 'console'] if DEBUG else ['dhfile'],
            'level': 'DEBUG' if DEBUG else os.environ.get("DATAHUB_LOGGING_LEVEL", "INFO"),
            'propagate': True,
        }
    },
}

DATA_DIR = os.environ.get("NGZ_DATA_DIR", os.path.join(BASE_DIR, "data"))

# Digitraffic MQTT settings
DIGITRAFFIC = {
    'RESAMPLE_PERIOD': os.environ.get("DIGITRAFFIC_RESAMPLE_PERIOD", "1min"),
    'SCHEDULE': int(os.environ.get("DIGITRAFFIC_SCHEDULE_MINUTES", "5")),
    'PERIOD_HOURS': int(os.environ.get("DIGITRAFFIC_PERIOD_HOURS", "24")),
    'RESET_MQTT_MINUTES': int(os.environ.get("RESET_MQTT_MINUTES", 2)),
    'VESSELS': {
        'mqtt': {
            'host': os.environ.get("DIGITRAFFIC_VESSELS_HOST"),
            'topic': os.environ.get("DIGITRAFFIC_VESSELS_TOPIC"),
            'port': int(os.environ.get("DIGITRAFFIC_VESSELS_PORT", "61619")),
            'username': os.environ.get("DIGITRAFFIC_VESSELS_USERNAME"),
            'password': os.environ.get("DIGITRAFFIC_VESSELS_PASSWORD")
        }
    },
    'TRAINS': {
        'graphql_url': os.environ.get("DIGITRAFFIC_TRAINS_REST_URL",
                                      "https://rata.digitraffic.fi/api/v1/graphql/graphiql/?"),
        'train_categories': os.environ.get("DIGITRAFFIC_TRAINS_CATEGORIES", "Cargo").split(","),
        'mqtt': {
            'host': os.environ.get("DIGITRAFFIC_TRAINS_HOST"),
            'topic': os.environ.get("DIGITRAFFIC_TRAINS_TOPIC"),
            'port': int(os.environ.get("DIGITRAFFIC_TRAINS_PORT", "443")),
            'username': os.environ.get("DIGITRAFFIC_TRAINS_USERNAME"),
            'password': os.environ.get("DIGITRAFFIC_TRAINS_PASSWORD")
        }

    }
}
