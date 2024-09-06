## [1.3.6](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.3.5...v1.3.6) (2024-09-06)


### Bug Fixes

* **typescript:** ignore typescript errors from libraries ([da86e51](https://github.com/ShadyF/actual-budget-sms-proxy/commit/da86e5190cad4cb4bfe0c7b1ed6fcb5693d6a705))

## [1.3.5](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.3.4...v1.3.5) (2024-09-05)


### Bug Fixes

* **packages:** bummp @actual-app/api to v6.10.0 ([162a926](https://github.com/ShadyF/actual-budget-sms-proxy/commit/162a926382ff0c3ecbd9d43d6fe0e3c404b7f6fa))

## [1.3.4](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.3.3...v1.3.4) (2024-08-18)


### Bug Fixes

* **packages:** bummp @actual-app/api to v6.9.0 ([e01d66b](https://github.com/ShadyF/actual-budget-sms-proxy/commit/e01d66bf71525aecbc9a9f4670d70d25f1217233))

## [1.3.3](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.3.2...v1.3.3) (2024-07-22)


### Bug Fixes

* **ts:** fix build issues due to typescript ([5bf8c87](https://github.com/ShadyF/actual-budget-sms-proxy/commit/5bf8c8703ee3bae99e5124129d0d376df2d7ada6))

## [1.3.2](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.3.1...v1.3.2) (2024-07-20)


### Bug Fixes

* **packages:** bummp @actual-app/api to v6.8.2 ([ffda330](https://github.com/ShadyF/actual-budget-sms-proxy/commit/ffda330f3ce1c8b8e7dc62c85e496c169338546b))

## [1.3.1](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.3.0...v1.3.1) (2024-05-17)


### Bug Fixes

* **packages:** bummp @actual-app/api to v6.7.1 ([2747cdf](https://github.com/ShadyF/actual-budget-sms-proxy/commit/2747cdf86398824f6e7fb2c93efc9fdc0e89e2d5))

# [1.3.0](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.2.7...v1.3.0) (2024-03-18)


### Features

* **app:** FX Fee can now be defined per parser with a global default that can be optionally set (default is 10%) ([30c5d1e](https://github.com/ShadyF/actual-budget-sms-proxy/commit/30c5d1e4a6520d131f4d7f2ee7e68ab64d680800))
* **app:** Support setting the account's currency to avoid un-necessary FX Fees being applied ([f33c1fb](https://github.com/ShadyF/actual-budget-sms-proxy/commit/f33c1fb607d8e3a50203d3a441450e843aacd51b))
* **parser:** add auto_add_date key to support SMS bodies with no date information ([dc97566](https://github.com/ShadyF/actual-budget-sms-proxy/commit/dc9756614d749358d21e41a6d984591b39ccd87a))

## [1.2.7](https://github.com/ShadyF/actual-budget-sms-proxy/compare/v1.2.6...v1.2.7) (2024-03-08)


### Bug Fixes

* **npm:** bump @actual-app/api to v6.6.0 ([2966197](https://github.com/ShadyF/actual-budget-sms-proxy/commit/296619745bd1e455b97b73686d7d276e3084c3c1))

## [1.2.6](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.2.5...v1.2.6) (2024-03-08)


### Bug Fixes

* fix foreign exchange not working by migrating to new foreign exchange repo (https://github.com/fawazahmed0/exchange-api) ([9c9952c](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/9c9952c5c727ecb13ef0a3626ea715ef03d60bac))

## [1.2.5](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.2.4...v1.2.5) (2024-03-02)


### Bug Fixes

* type in ACTUAL_SERVER_PROTOCOL (was ACTUAL_SERVER_PROCTOCOL) ([133f0e5](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/133f0e5721c5a205e7359165237e7644fe2c6918))

## [1.2.4](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.2.3...v1.2.4) (2024-02-17)


### Bug Fixes

* fix app not building due to missing typescript types ([8adf6c5](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/8adf6c5d92d6d11290935c52f16073cd450d2cc7))

## [1.2.3](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.2.2...v1.2.3) (2024-02-17)


### Bug Fixes

* **node_modules:** bump actual-budget/api to 6.5.0 ([d0904bf](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/d0904bf4ade8f1a9afe27c364ea10d73576db81a))

## [1.2.2](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.2.1...v1.2.2) (2023-12-09)


### Bug Fixes

* **node_modules:** bump actual-budget/api to 6.3.0 ([9dfc58b](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/9dfc58bc404af9ea889ba94292fe39dc4a7d4fa8))

## [1.2.1](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.2.0...v1.2.1) (2023-10-16)


### Bug Fixes

* **parser:** remove commas from amount group when parsing ([25e4b6b](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/25e4b6beb99093a3efb7bf015bfb8f8332a66cf9))

# [1.2.0](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.1.0...v1.2.0) (2023-10-16)


### Features

* Support date inference if a "date" regex group is provided instead of "day", "month" and "year" ([08f4145](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/08f4145de944e44e21131cbc1100745f86660a94))

# [1.1.0](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.0.1...v1.1.0) (2023-10-14)


### Features

* Support transfers between accounts ([afeb2b3](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/afeb2b3b8279d2ab6dfaf618ae865e8895aa5830))

## [1.0.1](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/compare/v1.0.0...v1.0.1) (2023-10-14)


### Bug Fixes

* **server:** change default server port to be 8080 ([b70241b](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/b70241bfc0b9d07f584915ec2e53a0942e645792))

# 1.0.0 (2023-10-14)


### Bug Fixes

* **docker:** remove --omit=dev flag from npm ci ([c9dd75e](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/c9dd75ef9771f51f4517939810ce2ecbb6d09596))


### Features

* add currency conversion, main currency support, foreign currency factor ([7f22e44](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/7f22e44e0f6a1ea3e4044a303572fb0c4644a5e7))
* add Dockerfile and github workflows ([c8c8a3b](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/c8c8a3b61afbedf8fd6a3e563b5891d4aa868938))
* fetch config dynamically from JSON file ([5c4276e](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/5c4276e34da86ad4ab8eff2af4ccdea642930ed6))
* initial commit ([061b7ed](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/061b7ed471ad998e7a36c1252051c8dd9f5e81dd))

# 1.0.0 (2023-10-14)


### Features

* add currency conversion, main currency support, foreign currency factor ([7f22e44](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/7f22e44e0f6a1ea3e4044a303572fb0c4644a5e7))
* add Dockerfile and github workflows ([c8c8a3b](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/c8c8a3b61afbedf8fd6a3e563b5891d4aa868938))
* fetch config dynamically from JSON file ([5c4276e](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/5c4276e34da86ad4ab8eff2af4ccdea642930ed6))
* initial commit ([061b7ed](https://github.com/ShadyF/Actual-Budget-SMS-Proxy/commit/061b7ed471ad998e7a36c1252051c8dd9f5e81dd))
