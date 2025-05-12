exports.calculateAverage = (numbers) => {
    if (!numbers.length) return 0;
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    return sum / numbers.length;
};
