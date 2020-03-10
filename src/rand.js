/**
 * Return random integer in [0, 32767]
 *
 * The machine (assembly) code of the original game use "_rand()" function in Visual Studio 1988 Library.
 * I could't find out how this function works exactly.
 * But, anyhow, it should be a funtion that generate a random number.
 * I decided to use custom rand function which generates random integer in [0, 32767]
 * which follows rand() function in Visual Studio 2017 Library.
 *
 * @return {number} random integer
 */
export function rand() {
  return Math.floor(32768 * Math.random());
}
