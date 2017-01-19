const regions = {
  EUROPEAN_UNION: [
    'AUSTRIA',
    'BELGIUM',
    'BULGARIA',
    'CROATIA',
    'CYPRUS',
    'CZECH_REPUBLIC',
    'DENMARK',
    'ESTONIA',
    'FINLAND',
    'FRANCE',
    'GERMANY',
    'GREECE',
    'HUNGARY',
    'IRELAND',
    'ITALY',
    'LATVIA',
    'LITHUANIA',
    'LUXEMBOURG',
    'MALTA',
    'NETHERLANDS',
    'POLAND',
    'PORTUGAL',
    'ROMANIA',
    'SLOVAKIA',
    'SLOVENIA',
    'SPAIN',
    'SWEDEN',
    'UNITED_KINGDOM',
  ],
  EUROPEAN_ECONOMIC_AREA: [
    'ICELAND',
    'LIECHTENSTEIN',
    'NORWAY',
  ],
};

regions.EUROPEAN_ECONOMIC_AREA =
  regions.EUROPEAN_UNION.concat(regions.EUROPEAN_ECONOMIC_AREA);

export default regions;
