////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2016 ArangoDB GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Dr. Frank Celler
////////////////////////////////////////////////////////////////////////////////

#ifndef APPLICATION_FEATURES_CHECK_VERSION_FEATURE_H
#define APPLICATION_FEATURES_CHECK_VERSION_FEATURE_H 1

#include "ApplicationFeatures/ApplicationFeature.h"

struct TRI_vocbase_t;

namespace arangodb {

class StorageEngine;

class CheckVersionFeature final
    : public application_features::ApplicationFeature {
 private: 
  enum CheckVersionResult : int {
    NO_SERVER_VERSION = -5,
    NO_VERSION_FILE = -4,
    CANNOT_READ_VERSION_FILE = -3,
    CANNOT_PARSE_VERSION_FILE = -2,
    IS_CLUSTER = -1,
    VERSION_MATCH = 1,
    DOWNGRADE_NEEDED = 2,
    UPGRADE_NEEDED = 3,
  };

 public:
  explicit CheckVersionFeature(
      application_features::ApplicationServer* server, int* result,
      std::vector<std::string> const& nonServerFeatures);

 private:
  bool _checkVersion;

 public:
  void collectOptions(std::shared_ptr<options::ProgramOptions>) override final;
  void validateOptions(std::shared_ptr<options::ProgramOptions>) override final;
  void start() override final;

 private:
  void checkVersion();

  CheckVersionResult checkVersionFileForDB(TRI_vocbase_t* vocbase,
                                           StorageEngine* engine,
                                           uint32_t currentVersion) const;

 private:
  int* _result;
  std::vector<std::string> _nonServerFeatures;
};
}

#endif
