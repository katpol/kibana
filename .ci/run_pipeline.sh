#!/usr/bin/env bash

set -e

# move to Kibana root
cd "$(dirname "$0")/.."

# source src/dev/temp_pipeline_setup/extract_bootstrap_cache.sh
source ${WORKSPACE}/src/dev/temp_pipeline_setup/setup.sh
source ${WORKSPACE}/src/dev/temp_pipeline_setup/checkout_sibling_es.sh


# case "$JOB" in
# kibana-intake)
#   ./test/scripts/jenkins_unit.sh
#   ;;
# kibana-ciGroup*)
#   export CI_GROUP="${JOB##kibana-ciGroup}"
#   ./test/scripts/jenkins_ci_group.sh
#   ;;
# kibana-visualRegression*)
#   ./test/scripts/jenkins_visual_regression.sh
#   ;;
# x-pack-intake)
#   ./test/scripts/jenkins_xpack.sh
#   ;;
# x-pack-ciGroup*)
#   export CI_GROUP="${JOB##x-pack-ciGroup}"
#   ./test/scripts/jenkins_xpack_ci_group.sh
#   ;;
# x-pack-visualRegression*)
#   ./test/scripts/jenkins_xpack_visual_regression.sh
#   ;;
# *)
#   echo "JOB '$JOB' is not implemented."
#   exit 1
#   ;;
# esac
