import querystring from "querystring";

export function decoder(encodedUrl: string) {
  let firstPart = encodedUrl.slice(0, 9);
  let secondPart = encodedUrl.slice(9);

  let encodedNum = 0;
  let counter = 0;
  let part1 = "";

  for (const letter of secondPart) {
    encodedNum <<= 6;
    try {
      let letterNum =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(
          letter
        );
      encodedNum |= letterNum;

      counter += 1;

      if (counter === 4) {
        part1 += String.fromCharCode((16711680 & encodedNum) >> 16);
        part1 += String.fromCharCode((65280 & encodedNum) >> 8);
        part1 += String.fromCharCode(255 & encodedNum);

        encodedNum = 0;
        counter = 0;
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (counter === 2) {
    encodedNum >>= 4;
    part1 += String.fromCharCode(encodedNum);
  } else if (counter === 3) {
    encodedNum >>= 2;
    part1 += String.fromCharCode((65280 & encodedNum) >> 8);
    part1 += String.fromCharCode(255 & encodedNum);
  }
  try {
    part1 = querystring.unescape(part1);
  } catch (error) {
    console.error(error);
  }

  let arr: any = {};
  let i = 0;
  const byteSize = 256;
  let final = "";

  for (let c = 0; c < byteSize; c++) {
    arr[c] = c;
  }

  let x = 0;

  for (let c = 0; c < byteSize; c++) {
    x = (x + arr[c] + firstPart.charCodeAt(c % firstPart.length)) % byteSize;
    i = arr[c];
    arr[c] = arr[x];
    arr[x] = i;
  }
  x = 0;
  let d = 0;

  for (let s = 0; s < part1.length; s++) {
    d = (d + 1) % byteSize;
    x = (x + arr[d]) % byteSize;

    i = arr[d];
    arr[d] = arr[x];
    arr[x] = i;

    final += String.fromCharCode(
      part1.charCodeAt(s) ^ arr[(arr[d] + arr[x]) % byteSize]
    );
  }
  return final;
}
