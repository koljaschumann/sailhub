FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy all app dist folders
COPY apps/web/dist /usr/share/nginx/html
COPY apps/startgelder/dist /usr/share/nginx/html/startgelder
COPY apps/saisonplanung/dist /usr/share/nginx/html/saisonplanung
COPY apps/eventanmeldung/dist /usr/share/nginx/html/eventanmeldung
COPY apps/schadensmeldung/dist /usr/share/nginx/html/schadensmeldung
COPY apps/saisoncharter/dist /usr/share/nginx/html/saisoncharter
COPY apps/jugendleistungsfonds/dist /usr/share/nginx/html/jugendleistungsfonds
COPY apps/jahresauswertung/dist /usr/share/nginx/html/jahresauswertung
COPY apps/spendenportal/dist /usr/share/nginx/html/spendenportal

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
