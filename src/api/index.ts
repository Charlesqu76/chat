import axios from "axios";
export const fetchChatGPT = async (param: {
  data: string;
  cancelToken?: any;
  apiKey: string;
}): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    axios
      .post(
        "https://api.openai.com/v1/completions",
        {
          model: "text-davinci-003",
          prompt: param.data,
          max_tokens: 2000,
          stop: ["@$@"],
        },
        {
          headers: {
            Authorization: `Bearer ${param.apiKey}`,
            "Content-Type": "application/json",
          },
          cancelToken: param.cancelToken,
        }
      )
      .then((res) => resolve(res.data))
      .catch((e) => {
        resolve({ isError: true });
      });
  });
};
