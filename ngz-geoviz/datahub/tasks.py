import logging

from celery import shared_task

from .digitraffic import VesselFetcher, VesselSaver, TrainFetcher, TrainSaver

logger = logging.getLogger(__name__)


def __load_digitraffic_common(fetcher, type):
    logger.info(f"Fetching Digitraffic {type}")
    fetcher.start()
    logger.debug(f"Stopping fetching Digitraffic {type}")


@shared_task
def load_digitraffic_vessels():
    __load_digitraffic_common(VesselFetcher(), VesselFetcher.name)


@shared_task
def load_digitraffic_trains():
    __load_digitraffic_common(TrainFetcher(), TrainFetcher.name)


@shared_task
def populate_digitraffic_data(resample_period="10s"):
    delete_files = True  # not settings.DEBUG
    try:
        saver = VesselSaver(resample_period, delete_files)
        logger.info(f"Populating models for {VesselSaver.name}")
        saver.populate()
        saver.save_cached_file()

        saver = TrainSaver(resample_period, delete_files)
        logger.info(f"Populating models for {TrainSaver.name}")
        saver.populate()
        saver.save_cached_file()
    except Exception:
        logger.exception("Error occurred during populating database")
        raise ()
