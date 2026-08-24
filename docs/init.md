# init

```
Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "init"
git remote add origin "https://github.com/kaisaohnae/kaisa-tool.git"
git branch -M main
git push -u --force origin main
```

GitHub Pages: Settings → Pages → Source = `gh-pages`  
Actions 권한: Read and write permissions
