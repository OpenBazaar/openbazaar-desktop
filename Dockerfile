FROM ubuntu:17.10

ARG VERSION=2.1.1
ARG TINI_VERSION=0.17.0

RUN apt-get update \
    && apt-get install -y wget libcanberra-gtk-module \
    && cd /tmp \
        && wget -O openbazaar2.deb https://github.com/OpenBazaar/openbazaar-desktop/releases/download/v${VERSION}/openbazaar2_${VERSION}_amd64.deb \
        && (dpkg -i openbazaar2.deb || true) \
        && apt --fix-broken install -y \
        && rm openbazaar2.deb \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ADD https://github.com/krallin/tini/releases/download/v${TINI_VERSION}/tini /tini
RUN chmod +x /tini

ENTRYPOINT ["/tini", "--"]
CMD ["sleep", "infinity"]