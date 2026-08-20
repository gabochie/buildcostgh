async function check() {
  const urls = [
    'http://localhost:3111/calculator',
    'http://localhost:3111/api/building-types',
  ];
  for (const url of urls) {
    const r = await fetch(url);
    const body = await r.text();
    console.log('\n=== ' + url.replace('http://localhost:3111','') + ' ===');
    console.log('Status:', r.status, 'Size:', body.length);
    if (url.includes('calculator')) {
      console.log('Has BuildingType component:', body.includes('BuildingType') || body.includes('building-type'));
      console.log('Has Step 7 of 7:', body.includes('7 of 7'));
    }
    if (url.includes('building-types')) {
      const json = JSON.parse(body);
      console.log('Categories:', json.categories?.length);
      json.categories?.forEach(c => console.log('  -', c.name, '(' + c.slug + '):', c.subtypes?.length, 'subtypes'));
    }
  }
}
check();
