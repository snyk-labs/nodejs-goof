curl --include \
     --header "Content-Type: application/json" \
     --header "Authorization: token $SNYK_TOKEN" \
  'https://snyk.io/api/v1/org/0e415b97-149f-46d2-8728-0f9fda933b27/project/61414247-e0e6-41a7-90f5-dc3cb1dcba7c/dep-graph'