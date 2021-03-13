import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import dayjs from "dayjs";
import { useLottie } from "lottie-react";
import ClaimingAnimation from "./assets/ClaimingAnimation.json";
import { aWSBAirDropABI } from "./ABI/airdrop.json";
import { EIP20 } from "./ABI/eip-20.json";
import { AWSB_TOKEN_ADDRESS, AWSB_AIRDROP_CONTRACT_ADDRESS } from "./const";
import airdrop from "./assets/airdrop-mini.png";
import success from "./assets/success-mini.png";
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
const ethersProvider = new ethers.providers.Web3Provider(
  window.ethereum,
  "any"
);

const signer = ethersProvider.getSigner();

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

function App() {
  const [address, setAddress] = useState<string>();
  const [expiredTime, setExpiredTime] = useState<number>(0);
  const [claimBalance, setClaimBalance] = useState<number>(0);
  const [errorNetWork, setErrorNetWork] = useState<boolean>(false);
  const [aWSBTokenBalance, setaWSBTokenBalance] = useState<number>();
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState<boolean>();
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<boolean>(false);

  useEffect(() => {
    let chainId: number;
    const getNetWork = async () => {
      chainId = (await ethersProvider.getNetwork()).chainId;
      if (chainId !== 97) {
        setErrorNetWork(true);
        setAddress("");
      }
    };
    getNetWork();
  }, []);

  useEffect(() => {
    setIsMetaMaskConnected(Boolean(ethereum.selectedAddress));
  }, []);

  const change = (accounts: any[]) => {
    setIsMetaMaskConnected(
      accounts.length > 0 && Boolean(ethereum.selectedAddress)
    );
    if (!(accounts.length > 0 && Boolean(ethereum.selectedAddress))) {
      setAddress("");
    }
  };
  ethereum.on("accountsChanged", change);

  const getAirdropInfos = async () => {
    await init();
    if (isMetaMaskConnected) {
      let walletAccounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(walletAccounts[0]);
      let aWSBTokenBalance: ethers.BigNumber = await aWSBTokenContract.balanceOf(
        walletAccounts[0]
      );
      let expiredTime: ethers.BigNumber = await aWSBAirDropContract.claimExpiredAt();
      let claimBalance: ethers.BigNumber = await aWSBAirDropContract.claimWhitelist(
        walletAccounts[0]
      );
      setExpiredTime(expiredTime.toNumber());
      setaWSBTokenBalance(aWSBTokenBalance.div((1e18).toString()).toNumber());
      setClaimBalance(claimBalance.div((1e18).toString()).toNumber());
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
    claiming || claimSuccess || Number(claimBalance) === 0;

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
      setClaimError(true);
    }
  };

  return (
    <div className="App">
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
          </div>
          <div className="address-info">
            <div className="key address-text">
              <div
                className="connected"
                style={{
                  background: address ? "#52c41a" : "#E1694E",
                }}
              ></div>
              {address
                ? formatAddress(String(address))
                : errorNetWork
                ? "BSC Only !   Please Switch NetWork."
                : "Please Unlock Wallet."}
            </div>
            {address && (
              <Fragment>
                <div className="key token-balance">
                  Balance:{" "}
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {aWSBTokenBalance} aWSB
                  </span>
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
          ) : errorNetWork ? (
            <button
              className="claim-button"
              disabled
              style={{
                background: "#858da1",
              }}
            >
              Please Switch NetWork to BSC.
            </button>
          ) : (
            <button
              className="claim-button"
              style={{
                background: "#4B2CC8",
              }}
              onClick={connectWallet}
            >
              Unlock Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
