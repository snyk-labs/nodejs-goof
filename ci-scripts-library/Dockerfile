# This is a multistage container builder for poetry projects

FROM python:3.9-slim AS requirements

ENV PYTHONDONTWRITEBYTECODE 1

# Add jq and curl

RUN apt-get -qq update && apt-get -qq install --no-install-recommends -y jq curl

RUN apt-get -qq clean

# step one is to create a container with poetry on it
RUN python -m pip install --quiet -U pip poetry

WORKDIR /app

COPY pyproject.toml .
COPY poetry.lock .

COPY ci_scripts_library ./ci_scripts_library

RUN poetry install

COPY scripts/entrypoint.sh /usr/local/bin/

ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]