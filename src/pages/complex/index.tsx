import React from "react";
import "./index.scss";
import Output from "../../components/output";
import { getinput, uuid } from "../../util";
import { fetchChatGPT } from "../../api";
import { EIdentity, TtextList } from "../../type";
import axios from "axios";
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const CHATLIST = "CHATLIST";
const APIKEY = "APIKEY";

type IChatList = Array<{
  title: string;
  id: string;
  textList: TtextList;
}>;
type IState = {
  isSpeak: boolean;
  inputValue: string;
  isLoading: boolean;
  chatList: IChatList;
  selectChat: string;
  apiKey: string;
  showSetting: boolean;
};

class App extends React.Component<{}, IState> {
  recognition: any;
  synth: SpeechSynthesis | undefined;
  constructor(props: any) {
    super(props);
    this.state = {
      isSpeak: false,
      inputValue: "",
      isLoading: false,
      chatList: [],
      selectChat: "",
      apiKey: "",
      showSetting: true,
    };
  }

  componentDidMount(): void {
    this.init();
    document.addEventListener("keypress", this.handleKeyPress);
  }

  init = () => {
    const storageChatList = JSON.parse(localStorage.getItem(CHATLIST));
    try {
      if (storageChatList.length) {
        this.setState({
          chatList: storageChatList,
          selectChat: storageChatList[0].id,
        });
      } else {
        this.noChatList();
      }
    } catch (e) {
      this.noChatList();
    }

    this.setState({
      apiKey: localStorage.getItem(APIKEY) || "",
    });
  };

  noChatList = () => {
    const id = uuid();
    this.setState(
      {
        chatList: [{ id, title: "", textList: [] }],
        selectChat: id,
      },
      () => {
        localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
      }
    );
  };

  componentWillUnmount(): void {
    document.removeEventListener("keypress", this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    if (e.code === "Enter" && !this.state.isLoading) {
      this.hh();
    }
  };

  hh = async () => {
    const { selectChat, chatList, inputValue } = this.state;
    if (!inputValue) return;
    let newTextList = [];
    const newChatList = chatList.reduce((acc, cur) => {
      if (cur.id === selectChat) {
        cur.title = cur.title || inputValue;
        newTextList = [
          ...cur.textList,
          { identity: EIdentity.USER, text: inputValue },
        ];
        cur.textList = newTextList;
      }
      acc.push(cur);
      return acc;
    }, []);

    this.setState(
      {
        inputValue: "",
        isLoading: true,
        chatList: newChatList,
      },
      () => {
        localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
      }
    );

    const data = await fetchChatGPT({
      data: getinput(newTextList),
      cancelToken: source.token,
      apiKey: this.state.apiKey,
    });

    const { choices = [], isError } = data;
    const { text: newText } = choices[0] || {};
    if (isError || !newText) {
      const newChatListAfter = this.state.chatList.reduce((acc, cur) => {
        if (cur.id === selectChat) {
          cur.title = cur.title || inputValue;
          newTextList = [
            ...cur.textList,
            {
              identity: EIdentity.GPT,
              text: "我出问题喽！！！",
              isError: true,
            },
          ];
          cur.textList = newTextList;
        }
        acc.push(cur);
        return acc;
      }, []);
      this.setState({
        chatList: newChatListAfter,
        isLoading: false,
      });
      return;
    }
    const newChatListAfter = this.state.chatList.reduce((acc, cur) => {
      if (cur.id === selectChat) {
        cur.title = cur.title || inputValue;
        newTextList = [
          ...cur.textList,
          { identity: EIdentity.GPT, text: newText },
        ];
        cur.textList = newTextList;
      }
      acc.push(cur);
      return acc;
    }, []);
    this.setState(
      {
        chatList: newChatListAfter,
        isLoading: false,
      },
      () => {
        localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
      }
    );
  };

  handleChangeItem = (id: string) => {
    if (this.state.isLoading) {
      source.cancel();
    }
    this.setState({ selectChat: id });
  };

  handleAddChat = () => {
    const id = uuid();
    const noContentList = !!this.state.chatList.filter((v) => !v.title).length;
    !noContentList &&
      this.setState({
        chatList: [{ id, title: "", textList: [] }, ...this.state.chatList],
        selectChat: id,
      });
  };

  handleDeleteChat = (id: string) => {
    const { chatList } = this.state;
    const newChatList = chatList.filter((v) => v.id !== id);
    if (newChatList.length) {
      this.setState(
        { selectChat: newChatList[0].id, chatList: newChatList },
        () => {
          localStorage.setItem(CHATLIST, JSON.stringify(this.state.chatList));
        }
      );
    } else {
      this.noChatList();
    }
  };

  handleClickSettingConfirm = () => {
    this.setState({ showSetting: false });
    localStorage.setItem(APIKEY, this.state.apiKey);
  };

  renderApiKey = () => {
    const { apiKey } = this.state;
    return (
      <div className="setting">
        <div className="setting-apikey">
          <span className="setting-apikey-label">api kay</span>
          <input
            className="setting-apikey-input"
            placeholder="请输入api key"
            value={apiKey}
            onChange={(e) => {
              this.setState({ apiKey: e.target.value });
            }}
          ></input>
        </div>
        <div className="setting-btn">
          <div
            className="setting-btn-text"
            onClick={this.handleClickSettingConfirm}
          >
            确定
          </div>
        </div>
      </div>
    );
  };

  render(): React.ReactNode {
    const { inputValue, isLoading, chatList, selectChat, showSetting } =
      this.state;
    const { textList = [] } =
      chatList.filter((v) => v.id === selectChat)[0] || {};
    const textListT = isLoading
      ? [...textList, { identity: EIdentity.GPT, text: "", loading: true }]
      : textList;
    return (
      <div className="complex">
        {showSetting && this.renderApiKey()}
        <div className="complex-slide">
          <span className="complex-slide-title">
            chat
            <span
              className="complex-slide-title-icon"
              onClick={() => this.setState({ showSetting: true })}
            >
              <svg
                t="1676813494711"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="2775"
                width="16"
                height="16"
              >
                <path
                  d="M550.4 74.666667c25.6 0 46.933333 19.2 53.333333 44.8l14.933334 85.333333 38.4 17.066667L727.466667 170.666667c19.2-14.933333 46.933333-12.8 66.133333 4.266666l2.133333 2.133334 53.333334 53.333333c19.2 19.2 21.333333 46.933333 6.4 68.266667l-49.066667 70.4 17.066667 38.4 85.333333 14.933333c23.466667 4.266667 42.666667 25.6 44.8 49.066667v78.933333c0 25.6-19.2 46.933333-44.8 53.333333l-85.333333 14.933334-17.066667 38.4 49.066667 70.4c14.933333 19.2 12.8 46.933333-4.266667 66.133333l-2.133333 2.133333-53.333334 53.333334c-19.2 19.2-46.933333 21.333333-68.266666 6.4l-70.4-49.066667-38.4 17.066667-14.933334 85.333333c-4.266667 23.466667-25.6 42.666667-49.066666 44.8h-78.933334c-25.6 0-46.933333-19.2-53.333333-44.8l-14.933333-85.333333-38.4-17.066667-72.533334 46.933333c-19.2 14.933333-46.933333 12.8-66.133333-4.266666l-2.133333-2.133334-53.333334-53.333333c-19.2-19.2-21.333333-46.933333-6.4-68.266667l49.066667-70.4-17.066667-38.4-85.333333-14.933333c-23.466667-4.266667-42.666667-25.6-44.8-49.066667v-78.933333c0-25.6 19.2-46.933333 44.8-53.333333l85.333333-14.933334 17.066667-38.4L170.666667 296.533333c-14.933333-19.2-12.8-46.933333 2.133333-64l2.133333-2.133333 53.333334-53.333333c19.2-19.2 46.933333-21.333333 68.266666-6.4l70.4 49.066666 38.4-17.066666 14.933334-85.333334c4.266667-23.466667 25.6-42.666667 49.066666-44.8H550.4z m-38.4 320c-64 0-117.333333 53.333333-117.333333 117.333333s53.333333 117.333333 117.333333 117.333333 117.333333-53.333333 117.333333-117.333333-53.333333-117.333333-117.333333-117.333333z"
                  fill="#ffffff"
                  p-id="2776"
                ></path>
              </svg>
            </span>
          </span>
          <div className="complex-slide-content">
            {chatList.map((v) => {
              const { title, id } = v;
              const activitied = id === selectChat;
              return (
                <div
                  key={id}
                  className={`tab-item ${
                    activitied ? "tab-item-activitied" : ""
                  }`}
                  onClick={() => this.handleChangeItem(id)}
                >
                  <span className="tab-item-text">{title || "未命名"}</span>

                  {activitied && chatList.length > 1 && (
                    <span
                      onClick={() => this.handleDeleteChat(id)}
                      className="tab-item-del"
                    >
                      <svg
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="3665"
                        width="16"
                        height="16"
                      >
                        <path
                          d="M512 0C229.216 0 0 229.216 0 512s229.216 512 512 512 512-229.216 512-512S794.784 0 512 0zM709.184 663.936c16.064 16.064 18.976 39.232 6.464 51.712s-35.648 9.6-51.712-6.464L512 557.248l-151.936 151.936c-16.064 16.064-39.232 18.976-51.712 6.464s-9.6-35.648 6.464-51.712L466.752 512l-151.936-151.936c-16.064-16.064-18.976-39.232-6.464-51.712 12.512-12.512 35.648-9.6 51.712 6.464L512 466.752l151.936-151.936c16.064-16.064 39.232-18.976 51.712-6.464 12.512 12.512 9.6 35.648-6.464 51.712L557.248 512 709.184 663.936z"
                          fill="#2c2c2c"
                          p-id="3666"
                        ></path>
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="complex-slide-add">
            <span
              className="complex-slide-add-text"
              onClick={this.handleAddChat}
            >
              添加对话
            </span>
          </div>
        </div>
        <div className="complex-content">
          <div className="complex-content-output">
            <Output textList={textListT}></Output>
          </div>

          <div className="complex-content-input">
            <input
              className="complex-content-input-input"
              placeholder="输入"
              value={inputValue}
              onChange={(e) => {
                this.setState({ inputValue: e.target.value });
              }}
            ></input>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
