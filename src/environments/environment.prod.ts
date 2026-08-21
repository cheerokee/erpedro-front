export const environment = {
  production: true,
  envName: 'production',
  namekey: 'erpedro',
  api: {
    protocol: 'https',
    host: 'erpedro-back-production.up.railway.app',
    front: 'localhost:4200',
    get url() {
      return `${this.protocol}://${this.host}`;
    },
  },
};
