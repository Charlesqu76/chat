import React from "react";
import { fetchChatGPT } from "../../api";
import { EIdentity, TtextList } from "../../type";
import Output from "../../components/output";

import "./index.scss";
import axios from "axios";
import { getinput } from "../../util";
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
type IState = {
  text: string;
  textList: TtextList;
  loading: boolean;
};

class App extends React.Component<{}, IState> {
  inputRef: React.RefObject<HTMLInputElement>;
  appWindow: any;
  constructor(props: any) {
    super(props);
    this.state = {
      text: "",
      textList: [],
      loading: false,
    };
    this.inputRef = React.createRef();
  }

  async componentDidMount() {
    this.appWindow = (await import("@tauri-apps/api/window")).appWindow;
    this.appWindow.onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        console.log("1111111111");

        this.appWindow.hide();
        this.inputRef?.current?.blur?.();
        // source.cancel();
        this.setState({
          text: "",
          textList: [],
          loading: false,
        });
      }
      if (focused) {
        this.inputRef?.current?.focus?.();
      }
    });

    document.addEventListener("keypress", this.handleKeyPress);
  }

  componentWillUnmount(): void {
    document.removeEventListener("keypress", this.handleKeyPress);
  }

  setWindowSize = async (param: { width?: number; height?: number }) => {
    const { width, height } = param;
    const innerSize = await this.appWindow.innerSize();
    height && (innerSize.height = height);
    width && (innerSize.width = width);
    this.appWindow.setSize(innerSize);
  };

  handleKeyPress = async (e) => {
    if (e.code === "Enter" && !this.state.loading) {
      this.hh();
    }
  };

  hh = async () => {
    const { textList, text } = this.state;
    if (!text) return;
    const newTextList = [...textList, { identity: EIdentity.USER, text: text }];
    this.setState({
      textList: newTextList,
      text: "",
      loading: true,
    });

    console.log(getinput(newTextList));
    const data = await fetchChatGPT({
      data: getinput(newTextList),
      cancelToken: source.token,
    });

    console.log(data);

    const { choices = [], isError } = data;
    const { text: newText } = choices[0] || {};
    if (isError || !newText) {
      this.setState({
        loading: false,
        textList: [
          ...this.state.textList,
          {
            identity: EIdentity.GPT,
            text: "我出问题喽！！！",
            isError: true,
          },
        ],
      });
      return;
    }

    this.setState({
      textList: [
        ...this.state.textList,
        { identity: EIdentity.GPT, text: newText },
      ],
      loading: false,
    });
  };

  render(): React.ReactNode {
    const { text, textList, loading } = this.state;
    const textListT = loading
      ? [...textList, { identity: EIdentity.GPT, text: "", loading: true }]
      : textList;
    return (
      <div className="easy">
        <div className="easy-input">
          <input
            ref={this.inputRef}
            className="easy-input-ref"
            placeholder="输入内容"
            value={text}
            onChange={(e) => this.setState({ text: e.target.value })}
          ></input>
        </div>
        <div className="easy-content">
          <div className="easy-content-body">
            <Output textList={textListT} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
