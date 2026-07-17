import { environment } from "../../../environments/environment";

export const getStorageKey = () => `${ environment.namekey }_token`;
