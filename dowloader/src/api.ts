import fetch from "node-fetch";
import * as cheerio from "cheerio";
const BASE_URL = "https://animesuge.io/ajax/anime";
import { Anime, Episode } from "./types";
import chalk from "chalk";
import { decoder } from "./utils/decoder";
import { unpack } from "unpacker";
import { createWriteStream } from "fs";
import axios from "axios";
import cliProgress from "cli-progress";

export const getEpisodeUrlToken = async (id: string) => {
  for (let i = 0; i < 5; i++) {
    let response;
    try {
      response = await fetch(`${BASE_URL}/episode?id=${id}`);
      const text = await response.text();
      const data: { url: string } = await JSON.parse(text);
      return { success: { token: data.url as string } };
    } catch (e) {
      setTimeout(() => {}, 5000);
    }
  }
  return { error: new Error("Data not found") };
};

export const searchAnimes = async (keyword: string) => {
  const response = await fetch(`${BASE_URL}/search?keyword=${keyword}`);
  if (!response.ok) {
    return { error: new Error("Search failed!") };
  }

  const text = await response.text();
  const html = JSON.parse(text)["html"];
  const $ = cheerio.load(html);

  const anchors = $("a");

  let animes: Anime[] = [];

  anchors.each((i, e) => {
    const title = $(e).find("div").attr("data-jtitle")?.toString();
    const id = $(e).attr("href")?.toString().split("-").pop();

    if (title && id) {
      animes.push({ title, id });
    }
  });
  return { success: { animes } };
};

export const getEpisodes = async (id: string) => {
  const response = await fetch(`${BASE_URL}/servers?id=${id}`);
  if (!response.ok) {
    return { error: new Error("Search failed") };
  }
  const text = await response.text();
  const html = JSON.parse(text)["html"];
  const $ = cheerio.load(html);
  const episodeList = $(".episodes");

  const episodes: Episode[] = [];

  episodeList.children().each((i, e) => {
    const episodeNumber = $(e)
      .find("a")
      .attr("href")
      ?.toString()
      .split("-")
      .pop();
    const dataSources = $(e)
      .find("a")
      .attr("data-sources")
      ?.toString()
      .split("-")
      .pop();

    if (episodeNumber && dataSources) {
      const dataSource = JSON.parse(dataSources)["35"];
      episodes.push({ episodeNumber: Number(episodeNumber), dataSource });
    }
  });
  return { success: { episodes } };
};

export const getDowloadUrl = async (dataSource: string) => {
  const result = await getEpisodeUrlToken(dataSource);
  const episodeUri = decoder(result?.success?.token as string);
  const regex =
    /https:\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/gm;
  const url = `${episodeUri.match(regex)}.html`;
  const response = await fetch(url);
  const text = await response.text();

  if (text === "File was deleted") {
    return "File was deleted";
  }

  const scriptRegex = /\s*(eval\(function[\W\w]*?)<\/script>/gm;

  const packedScript = scriptRegex.exec(text)?.toString().split("</script>")[0];

  const unpackedScript = unpack(packedScript as string);
  const dowloadUrlRegex = /player\.src\("([^"]*)/gm;
  const m = dowloadUrlRegex.exec(unpackedScript);
  const r = /\h([^"]*)/gm;
  const finalDowloadUrl = r.exec(m![0])![0];

  return finalDowloadUrl;
};

export async function dowloadEpisode(url: string, filename: string) {
  console.log("Connecting …");
  const { data, headers } = await axios(url, {
    method: "get",
    responseType: "stream",
    headers: {
      referer: url,
    },
  });

  const totalLength = headers["content-length"];
  console.log("Starting download");

  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_grey);

  const writer = createWriteStream(filename);

  bar1.start(totalLength, 0);

  data.on("data", (chunk: any) => {
    bar1.increment(chunk.length);
  });
  data.pipe(writer);

  data.on("error", () => {
    writer.close();
  });
  writer.on("finish", () => {
    bar1.stop();
    console.log(chalk.yellow("Dowload finished"));
    writer.close();
  });
}
