export const generateFilename = (name: string, episodeNumber: number) => {
  return `${name.split(" ").join("-")}-episode-${episodeNumber}.mp4`;
};
