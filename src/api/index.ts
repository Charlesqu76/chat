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
