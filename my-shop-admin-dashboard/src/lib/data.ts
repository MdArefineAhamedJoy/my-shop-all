import data from "../data/fake.json";

export const getFakeData = () => {
  return data;
};

export type FakeData = typeof data;
