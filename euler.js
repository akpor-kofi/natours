const longestCollatzSequence = (num) => {
  let count = 0;
  let maxCount = 0;
  let maxNum = 0;

  // eslint-disable-next-line no-labels
  for (let i = 1; i <= num; i += 2) {
    for (let j = i; j >= 1; ) {
      //
      if (j === 1) {
        // eslint-disable-next-line no-labels
        break;
      } else if (j % 2 === 0) {
        j /= 2;
      } else {
        j = 3 * j + 1;
      }
      // eslint-disable-next-line no-plusplus
      count++;
    }
    if (count > maxCount) {
      maxCount = count;
      maxNum = i;
    }
    count = 0;
  }
  console.log(maxNum, maxCount);
};

// };
console.time('start');
longestCollatzSequence(1000000);
console.timeEnd('start');
