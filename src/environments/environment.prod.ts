export const environment = {
  production: true,
  envName: 'production',
  namekey: 'erpedro',
  api: {
    protocol: 'https',
    host: 'localhost:3004',
    front: 'localhost:4200',
    get url() {
      return `${this.protocol}://${this.host}`;
    },
  },
};
