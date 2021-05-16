import chalk from "chalk";
import program from "commander";
import { clear } from "console";
import figlet from "figlet";
import {
  dowloadEpisode,
  getDowloadUrl,
  getEpisodes,
  searchAnimes,
} from "./api";
import { prompt } from "inquirer";
import { generateFilename } from "./utils/generateFilename";

export const commander = async () => {
  clear();
  console.log(
    chalk.red(figlet.textSync("anime-cli", { horizontalLayout: "full" }))
  );
  program
    .command("search <keyword>")
    .alias("s")
    .description("Search animes by keyword")
    .action(async (keyword) => {
      const animesResult = await searchAnimes(keyword);

      if (animesResult.error) {
        return console.error(
          chalk.red(`Animes not found with keyword: ${chalk.yellow(keyword)}`)
        );
      }
      const animes = animesResult.success?.animes;
      chalk.red(`Animes found with keyword: ${chalk.yellow(keyword)}`);
      const pickedAnime = await prompt([
        {
          type: "list",
          name: `Animes`,
          choices: animes.map((a) => {
            return { name: a.title, value: a.id };
          }),
        },
      ]);

      const id = pickedAnime["Animes"];
      const animeName = animes.find((a) => a.id === id)?.title;

      const episodesResult = await getEpisodes(id);

      if (episodesResult.error) {
        return console.error(chalk.red(`Episodes not found`));
      }
      const episodes = episodesResult.success.episodes;

      const pickedEpisode = await prompt([
        {
          type: "list",
          name: `Episode`,
          choices: episodes.map((e) => {
            return { name: e.episodeNumber, value: e.dataSource };
          }),
        },
      ]);

      const episodeDataSource = pickedEpisode["Episode"];
      const episodeNum = episodes.find(
        (e) => e.dataSource === pickedEpisode["Episode"]
      )?.episodeNumber;
      const dowloadUrlResult = await getDowloadUrl(episodeDataSource);

      if (dowloadUrlResult === "File was deleted") {
        return console.log(chalk.red("File deleted"));
      }

      const filename = generateFilename(
        animeName as string,
        episodeNum as number
      );
      console.log(filename);
      const dowload = await prompt([
        {
          type: "confirm",
          name: `Dowload`,
        },
      ]);

      if (dowload["Dowload"]) {
        await dowloadEpisode(dowloadUrlResult, filename);
      }
    });
  await program.parseAsync(process.argv);
};
