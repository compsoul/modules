// modal/index.js

import { create as createModal } from "./create.js";

export async function create(options = {}) {
  return createModal(options);
}
