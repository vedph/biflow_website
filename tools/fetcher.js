const { Biflow } = require("../js/biflow.js");

const urls = {};

Biflow.getDataWithFullPath = async (path) => {
  // Let's see if we have this path in the cache.
  if (path in urls) {
    return urls.get(path);
  }

  const resp = await fetch(Biflow.URL + path, { headers: { "Accept": "application/json" }});
  const json = await resp.json();

  // Let's store it in the cache.
  urls[path] = json;
  return json;
};

async function start() {
  await Promise.all([
      "manuscripts",
      "people",
      "works",
    ].map(item =>
      Biflow.getData(`/${item}`).
        then(items => items.map(data => urls[`${Biflow.path}/${item}/${data.id}`] = data))
  ));

  console.log(`Biflow.preloadData(${JSON.stringify(urls)});`);
}

start();
