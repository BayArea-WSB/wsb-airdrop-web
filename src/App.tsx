import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import dayjs from "dayjs";
import { useLottie } from "lottie-react";
import BigNumber from "bignumber.js";
import ClaimingAnimation from "./assets/ClaimingAnimation.json";
import { aWSBAirDropABI } from "./ABI/airdrop.json";
import { EIP20 } from "./ABI/eip-20.json";
import {
  BSC_MAINNET_ID,
  AWSB_TOKEN_ADDRESS,
  AWSB_AIRDROP_CONTRACT_ADDRESS,
  aWSBTokenInfo,
} from "./const";
import airdrop from "./assets/airdrop-mini.png";
import success from "./assets/success-mini.png";
import binanceLogo from "./assets/binance-logo.png";
import metamask from "./assets/metamask.png";
import "./App.less";
import { Fragment } from "react";

declare global {
  interface Window {
    ethereum: any;
  }
}

const ethereum = window.ethereum;
let aWSBAirDropContract: ethers.Contract;
let aWSBTokenContract: ethers.Contract;
const aWSBTokenAddress = AWSB_TOKEN_ADDRESS;
const aWSBAirDropContractAddress = AWSB_AIRDROP_CONTRACT_ADDRESS;
let ethersProvider: any;
let signer: any;
if (ethereum) {
  ethersProvider = new ethers.providers.Web3Provider(ethereum, "any");
  signer = ethersProvider.getSigner();
}
console.log("🚀 ~ file: App.tsx ~ line 33 ~ ethersProvider", ethersProvider);

const init = async () => {
  aWSBAirDropContract = new ethers.Contract(
    aWSBAirDropContractAddress,
    aWSBAirDropABI,
    ethersProvider
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  aWSBTokenContract = new ethers.Contract(aWSBTokenAddress, EIP20);
  aWSBTokenContract = aWSBTokenContract.connect(signer);
  aWSBAirDropContract = aWSBAirDropContract.connect(signer);
};

const formatAddress = (address: string) => {
  return address.substr(0, 8) + "..." + address.substr(address.length - 8, 8);
};

function Loaing() {
  return (
    <div style={{ transform: "scale(0.45)" }}>
      <div className="lds-roller">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}

function Claiming() {
  const options = {
    animationData: ClaimingAnimation,
    loop: true,
    autoplay: true,
  };

  const { View } = useLottie(options);

  return <div className="claiming-animation">{View}</div>;
}

async function addToMask() {
  try {
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    const wasAdded = await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20", // Initially only supports ERC20, but eventually more!
        options: {
          address: aWSBTokenInfo.tokenAddress, // The address that the token is at.
          symbol: aWSBTokenInfo.tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
          decimals: aWSBTokenInfo.tokenDecimals, // The number of decimals in the token
          image: aWSBTokenInfo.tokenImage, // A string url of the token logo
        },
      },
    });

    if (wasAdded) {
      console.log("Thanks for your interest!");
    } else {
      console.log("Your loss!");
    }
  } catch (error) {
    console.log(error);
  }
}

function App() {
  const [address, setAddress] = useState<string>("");
  const [expiredTime, setExpiredTime] = useState<number>(0);
  const [claimBalance, setClaimBalance] = useState<string>("0");
  const [errorNetWork, setErrorNetWork] = useState<boolean>(false);
  const [aWSBTokenBalance, setaWSBTokenBalance] = useState<string>("0");
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState<boolean>();
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(true);
  const [noWallet, setNotWallet] = useState<boolean>(false);

  useEffect(() => {
    if (!ethereum) {
      setNotWallet(true);
      setConnecting(false);
      return;
    }
    let chainId: number;
    setConnecting(true);
    const getNetWork = async () => {
      chainId = (await ethersProvider.getNetwork()).chainId;
      if (chainId !== BSC_MAINNET_ID) {
        setErrorNetWork(true);
        setAddress("");
      }
    };
    getNetWork();
    async function getAccount() {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsMetaMaskConnected(Boolean(ethereum.selectedAddress));
      setConnecting(false);
    }
    getAccount();
  }, []);

  const change = (accounts: any[]) => {
    setIsMetaMaskConnected(
      accounts.length > 0 && Boolean(ethereum.selectedAddress)
    );
    if (!(accounts.length > 0 && Boolean(ethereum.selectedAddress))) {
      setAddress("");
    }
  };
  if (ethereum) {
    ethereum.on("accountsChanged", change);
  }

  const getAirdropInfos = async () => {
    await init();
    if (isMetaMaskConnected && !errorNetWork) {
      let walletAccounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(walletAccounts[0]);
      let aWSBTokenBalance: ethers.BigNumber = await aWSBTokenContract.balanceOf(
        walletAccounts[0]
      );
      let expiredTime: ethers.BigNumber = await aWSBAirDropContract.claimExpiredAt();
      console.log(
        "🚀 ~ file: App.tsx ~ line 142 ~ getAirdropInfos ~ expiredTime",
        expiredTime.toNumber()
      );
      let claimBalance: ethers.BigNumber = await aWSBAirDropContract.claimWhitelist(
        walletAccounts[0]
      );
      setExpiredTime(expiredTime.toNumber());
      setaWSBTokenBalance(
        new BigNumber(aWSBTokenBalance.toString())
          .div(1e18)
          .toFixed(4)
          .toString()
      );
      setClaimBalance(
        new BigNumber(claimBalance.toString())
          .div(1e18)
          .toFixed(4)
          .toString()
      );
    }
  };

  useEffect(() => {
    // 获取合约相关信息
    getAirdropInfos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMetaMaskConnected]);

  const connectWallet = async () => {
    return await ethereum.request({
      method: "eth_requestAccounts",
    });
  };

  const claimButtonDisabled =
    claiming ||
    claimSuccess ||
    Number(claimBalance) === 0 ||
    dayjs().isAfter(dayjs.unix(expiredTime));

  const claim = async () => {
    setClaiming(true);
    try {
      let process = await aWSBAirDropContract.claim();
      try {
        await process.wait();
        setClaimSuccess(true);
        getAirdropInfos();
      } catch (error) {}
      setClaiming(false);
    } catch (error) {
      setClaiming(false);
    }
  };

  return (
    <div className="App">
      <div className="address">
        Token:{AWSB_TOKEN_ADDRESS}
        AirDrop: {AWSB_AIRDROP_CONTRACT_ADDRESS}
      </div>
      <div className="main">
        {claiming ? (
          <Claiming />
        ) : (
          <img
            src={claimSuccess ? success : airdrop}
            className="airdrop-img"
            alt="img"
          />
        )}
        <div className="airdrop">
          <div className="title">
            <span style={{ fontWeight: 900 }}>aWSB</span>
            <span style={{ fontWeight: 300, marginLeft: "10px" }}>
              AirDrop Event
            </span>
            <div className="version">1.0.0</div>
          </div>
          <div className="address-info">
            <div className="key address-text">
              <div
                className="connected"
                style={{
                  background: address ? "#52c41a" : "#E1694E",
                }}
              ></div>
              {connecting && "Connecting..."}
              {noWallet && "Wallet not found!"}
              {address
                ? formatAddress(String(address))
                : errorNetWork && !connecting
                ? "BSC Only !   Please Switch NetWork."
                : connecting
                ? ""
                : !noWallet
                ? "Please Unlock Wallet."
                : ""}
            </div>
            {address && (
              <Fragment>
                <div className="key token-balance">
                  Balance:{" "}
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {aWSBTokenBalance} aWSB
                  </span>
                </div>
                <div className="token-info">
                  <div className="bsc-info">
                    <img className="binance-logo" src={binanceLogo} alt="" />
                    <div className="bsc-address">
                      BSC:{" "}
                      <span style={{ fontWeight: 600, marginLeft: 10 }}>
                        {formatAddress(aWSBTokenInfo.tokenAddress)}
                      </span>
                    </div>
                    <img
                      className="metamask-logo"
                      src={metamask}
                      alt=""
                      onClick={addToMask}
                    />
                  </div>
                </div>
                <div className="key claimed-balance">
                  To be claimed:{" "}
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {claimBalance} aWSB
                  </span>
                </div>
                <div className="key">
                  Claims Expired Time:
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {dayjs(expiredTime * 1000).format("YYYY-MM-DD")}
                  </span>
                </div>
              </Fragment>
            )}
          </div>
          {address ? (
            <button
              className="claim-button"
              onClick={claim}
              disabled={claimButtonDisabled}
              style={{
                background: claimSuccess
                  ? "#52c41a"
                  : claimButtonDisabled
                  ? "#858da1"
                  : "#ec615b",
              }}
            >
              {claiming ? <Loaing /> : claimSuccess ? "Success!" : "Claim"}
            </button>
          ) : errorNetWork || noWallet ? (
            <button
              className="claim-button"
              disabled
              style={{
                background: "#858da1",
              }}
            >
              {noWallet
                ? "Please Install MetaMask."
                : "Please Switch NetWork to BSC."}
            </button>
          ) : (
            <button
              className="claim-button"
              style={{
                background: "#4B2CC8",
              }}
              onClick={connectWallet}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Unlock Wallet"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
