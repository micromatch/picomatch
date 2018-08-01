
const memoize = (fn, max = 100) => {
  const memo = [];

  return input => {
    for (let i = 0; i < memo.length; i++) {
      if (memo[i].input === input) {
        const temp = memo[0];
        memo[0] = memo[i];
        memo[i] = temp;
        return memo[0].result;
      }
    }

    const result = fn(input);
    memo.push({input, result});

    if (memo.length > max) {
      memo.unshift();
    }
    return result;
  };
};
