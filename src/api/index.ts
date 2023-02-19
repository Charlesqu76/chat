import axios from "axios";
export const fetchChatGPT = async (param: {
  data: string;
  cancelToken?: any;
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
            Authorization:
              "Bearer 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",
            "Content-Type": "application/json",
          },
          cancelToken: param.cancelToken,
        }
      )
      .then((res) => resolve(res.data))
      .catch((e) => {
        console.log(e);
        resolve({ isError: true });
      });
  });
};
