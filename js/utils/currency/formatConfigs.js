// doc that shiznit up in here
export function shortAndSweet(data) {
  console.dir(data);
  const { isFiat } = data;
  console.log(isFiat);

  return {
    minDisplayDecimals: isFiat ? 2 : 0,
    maxDisplayDecimals: isFiat ? 2 : 4,
    // maxDisplayDecimalsOnZero: isFiat ? 4 : 8,
    maxDisplayDecimalsOnZero: 8,
  };
}
