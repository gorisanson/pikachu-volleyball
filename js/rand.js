// The original machine (assembly) code use "_rand()" function in Visual Studio 1988 Library.
// I could't find out how this function works exactly.
// But, anyhow, it should be a funtion that generate a random number.
// I decided to use custom rand function which generates random integer from [0, 32767]
// which follows rand() function in Visual Studio 2017 Library.
export function rand() {
  return Math.floor(32768 * Math.random());
}
