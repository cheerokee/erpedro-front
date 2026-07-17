export const environment = {
  production: false,
  envName: 'development',
  namekey: 'erpedro',
  api: {
    protocol: 'http',
    host: 'localhost:3005',
    front: 'localhost:4200',
    get url() {
      return `${this.protocol}://${this.host}`;
    },
  },
};
