// doc that shiznit up in here
export function shortAndSweet(data) {
  const { isFiat } = data;

  return {
    minDisplayDecimals: isFiat ? 2 : 0,
    maxDisplayDecimals: isFiat ? 2 : 4,
    maxDisplayDecimalsOnZero: 6,
  };
}
