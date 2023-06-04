FROM python:3.11.1

RUN pip install flask

COPY webapp.py webapp.py
COPY templates templates

EXPOSE 5000
RUN mkdir /uploads

# RUN useradd -u 999 -G sudo -ms /bin/bash webadmin
# RUN chown webadmin:webadmin /uploads
# USER webadmin:webadmin

CMD ["python3","webapp.py"]
